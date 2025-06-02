import numpy as np
import cv2
import os
import mediapipe as mp
import tensorflow as tf
import keras
from queue import Queue
from threading import Thread
import math
from scipy.spatial.transform import Rotation

SEQ_LEN = 10
IMAGE_CAM_HEIGHT = 720
IMAGE_CAM_WIDTH = 1080
FILE_PATH_FOR_CLASS = 'class_name.txt'
CLASS_LIST = [name.strip() for name in open(FILE_PATH_FOR_CLASS,'r').readlines()]
NUM_WORD = len(CLASS_LIST)

#SHARED THREAD VAR
SENTEN = ''
sample_queue = Queue(10) 

#INIT MEDIAPIPE MODEL
mp_draw = mp.solutions.drawing_utils
mp_holistic = mp.solutions.holistic.Holistic(static_image_mode = False, min_detection_confidence=0.5, min_tracking_confidence = 0.5)
#-----------------------------------------------------------------------------------------------------------------
@keras.saving.register_keras_serializable()
class PositionalEncoding(keras.layers.Layer):
    def __init__(self, seq_len, dim, **kwargs):
        super(PositionalEncoding, self).__init__()
        self.pos_encoding = self.get_positional_encoding(seq_len, dim)

    def get_positional_encoding(self, seq_len, dim):
        pos = np.arange(seq_len, dtype=np.float32)[:, np.newaxis]
        i = np.arange(dim, dtype=np.float32)[np.newaxis, :]
        angle_rates = 1 / np.power(10000.0, (2 * (i // 2)) / np.float32(dim))
        pos_encoding = pos * angle_rates
        pos_encoding[:, 0::2] = np.sin(pos_encoding[:, 0::2])
        pos_encoding[:, 1::2] = np.cos(pos_encoding[:, 1::2])
        return tf.convert_to_tensor(pos_encoding[np.newaxis, ...], dtype=tf.float32)

    def call(self, inputs):
        return inputs + self.pos_encoding

    def get_config(self):
        return super().get_config()

@keras.saving.register_keras_serializable()
class TransformerEncoder(keras.layers.Layer):
    def __init__(self, head_size=256, num_heads=12, ff_dim=512, dropout=0.1, **kwargs):
        super(TransformerEncoder, self).__init__()
        self.norm1 = keras.layers.LayerNormalization(epsilon=1e-6)
        self.attention = keras.layers.MultiHeadAttention(num_heads=num_heads, key_dim=head_size)
        self.norm2 = keras.layers.LayerNormalization(epsilon=1e-6)
        self.ffn = keras.Sequential([
            keras.layers.Dense(ff_dim, activation="gelu"),
            keras.layers.Dropout(rate = dropout),
            keras.layers.Dense(head_size, activation="linear"),
            keras.layers.Dropout(rate = dropout),
        ])

    def call(self, inputs):
        norm1 = self.norm1(inputs)
        attn_output = self.attention(norm1, norm1) + norm1
        norm2 = self.norm2(inputs + attn_output)
        ffn_output = self.ffn(norm2) + norm2
        return ffn_output


@keras.saving.register_keras_serializable()
class ViTSignLanguageModel(keras.Model):
    def __init__(self, seq_len, feature_dim, num_classes, **kwargs):
        super(ViTSignLanguageModel, self).__init__()
        # self.conv1 = keras.layers.Conv1D(162, kernel_size=3, activation='linear', padding='same')
        # self.conv2 = keras.layers.Conv1D(162, kernel_size=3, activation='linear', padding='same')
        self.pos_encoding = PositionalEncoding(seq_len, 162)
        self.class_token = self.add_weight(shape=(1, 1, 162), initializer= keras.initializers.RandomNormal(mean=0.5, stddev=0.5), trainable=True, name='class_token')
        self.lamda = keras.layers.Lambda(
            lambda tensor: keras.layers.concatenate((keras.ops.repeat(self.class_token, keras.ops.shape(tensor)[0], axis=0), tensor), axis = 1),
            output_shape=(seq_len + 1, 162))
        self.dropout = keras.layers.Dropout(0.2)
        self.encoders = [TransformerEncoder(162, 9, 512) for _ in range(4)]
        self.norm1 = keras.layers.LayerNormalization(epsilon=1e-6)
        self.glo_avg_pool = keras.layers.GlobalAveragePooling1D()
        self.norm2 = keras.layers.LayerNormalization(epsilon=1e-6)
        self.dense3 = keras.layers.Dense(num_classes, activation='softmax')
        

    def call(self, inputs):
        # x = self.conv1(inputs) + inputs
        # y = self.conv2(x) + x
        x = self.lamda(inputs)
        x = self.dropout(x)
        for encoder in self.encoders:
            x = encoder(x)
        x = x[...,0,:]
        x = self.norm1(x)
        y = self.glo_avg_pool(inputs)
        y = self.norm2(y)
        z = keras.layers.concatenate((x,y), axis = 1)
        return self.dense3(z)

    def get_config(self):
      return {
          'seq_len':SEQ_LEN,
          'feature_dim':162,
          'num_classes':NUM_WORD
      }

    @classmethod
    def from_config(cls, config):
      return cls(**config)

    def build(self, input_shape):
        x = keras.layers.Input(shape=input_shape)
        return keras.models.Model(inputs=[x], outputs=self.call(x))

    def build_graph(self, input_shape):
        x = keras.layers.Input(shape=input_shape)
        return keras.models.Model(inputs=[x], outputs=self.call(x))
    
#-----------------------------------------------------------------------------------------------------------------

def drawLandmarks(image, res):
    '''
    Function for draw landmark
    '''
    def drawLandmarksPose(image, pose_landmarks):
        if pose_landmarks:
            mp_draw.draw_landmarks(image,pose_landmarks,mp.solutions.pose.POSE_CONNECTIONS)

    def drawLandmarksHand(image, hand_landmarks):
        if hand_landmarks:
            mp_draw.draw_landmarks(image,hand_landmarks,mp.solutions.hands.HAND_CONNECTIONS)

    drawLandmarksPose(image, res.pose_landmarks)
    drawLandmarksHand(image, res.left_hand_landmarks)
    drawLandmarksHand(image, res.right_hand_landmarks)
#-----------------------------------------------------------------------------------------------------------------
def rotate_to_normal(list_of_landmarks: np.ndarray, normal: np.ndarray, around: np.ndarray):
    old_x_axis = np.array([1, 0, 0])

    z_axis = normal
    y_axis = np.cross(old_x_axis, z_axis)
    x_axis = np.cross(z_axis, y_axis)

    axis = np.stack([x_axis, y_axis, z_axis])

    return np.dot(list_of_landmarks - around, axis.T)


def get_hand_normal(list_of_landmarks: np.ndarray):
    plane_points = [
        0,  # Wrist
        17,  # Pinky CMC
        5,  # Index CMC
    ]

    triangle = list_of_landmarks[plane_points]

    v1 = triangle[1] - triangle[0]
    v2 = triangle[2] - triangle[0]

    normal = np.cross(v1, v2)
    normal /= np.linalg.norm(normal)
    return normal, triangle[0]


def get_hand_rotation(list_of_landmarks: np.ndarray):
    p1 = list_of_landmarks[0]  # Wrist
    p2 = list_of_landmarks[9]  # Middle CMC
    vec = p2 - p1
    return 90 + math.degrees(math.atan2(vec[1], vec[0]))


def rotate_hand(list_of_landmarks: np.ndarray, angle: float):
    r = Rotation.from_euler('z', angle, degrees=True)
    return np.dot(list_of_landmarks, r.as_matrix())


def scale_hand(list_of_landmarks: np.ndarray, size=1):
    p1 = list_of_landmarks[0]  # Wrist
    p2 = list_of_landmarks[9]  # Middle CMC
    current_size = np.sqrt(np.square(p2 - p1).sum())

    list_of_landmarks *= size / current_size
    return list_of_landmarks


def normalized_hand(list_of_landmarks: np.ndarray):
    # Make z value into range [0,1]
    list_of_landmarks[:, 2] = (list_of_landmarks[:, 2] - np.min(list_of_landmarks[:, 2])) / (np.max(list_of_landmarks[:, 2]) - np.min(list_of_landmarks[:, 2]))

    # First rotate to normal
    normal, base = get_hand_normal(list_of_landmarks)
    list_of_landmarks = rotate_to_normal(list_of_landmarks, normal, base)

    # Then rotate on the X-Y plane such that the BASE-M_CMC is on the Y axis
    angle = get_hand_rotation(list_of_landmarks)
    list_of_landmarks = rotate_hand(list_of_landmarks, angle)

    # Scale list_of_landmarks such that BASE-M_CMC is of size 1
    list_of_landmarks = scale_hand(list_of_landmarks, 200)

    return list_of_landmarks
#-----------------------------------------------------------------------------------------------------------------
def get_body_rotation(list_of_landmarks: np.ndarray, axis: str):
    '''
    axis = ['y','z']
    '''
    return math.degrees(math.atan2(list_of_landmarks[0, 1 if axis == 'z' else 2], list_of_landmarks[0, 0]))


def rotate_body(list_of_landmarks, angle, axis: str):
    '''
    axis = ['y','z']
    '''
    r = Rotation.from_euler(axis, angle if axis ==
                            'z' else -angle, degrees=True)
    return np.dot(list_of_landmarks, r.as_matrix())


def scale_body(list_of_landmarks: np.ndarray, size=1):
    p1 = list_of_landmarks[0]  # left shoulder
    p2 = list_of_landmarks[1]  # right shoulder
    current_size = np.sqrt(np.square((p2 - p1)/2).sum())

    list_of_landmarks *= size / current_size
    return list_of_landmarks


def out_bound(left_wrist, right_wrist, half_w, top_h, bot_h):
    left, right = - half_w, half_w
    top, bottom = - top_h, bot_h
    def out(
        land_mark): return land_mark[0] < left or land_mark[0] > right or land_mark[1] < top or land_mark[1] > bottom
    return out(left_wrist) and out(right_wrist)


def normalized_body(list_of_landmarks):
    # Make z value into range [0,1]
    list_of_landmarks[:, 2] = (list_of_landmarks[:, 2] - np.min(list_of_landmarks[:, 2])) / (np.max(list_of_landmarks[:, 2]) - np.min(list_of_landmarks[:, 2]))
    
    # get mid point of 2 shoulder
    center = (list_of_landmarks[0] + list_of_landmarks[1])/2
    
    # take this center as origin
    list_of_landmarks = list_of_landmarks - center
    
    # rotate around z
    angle = get_body_rotation(list_of_landmarks, 'z')
    list_of_landmarks = rotate_body(list_of_landmarks, angle, 'z')
    
    # rotate around y
    angle = get_body_rotation(list_of_landmarks, 'y')
    list_of_landmarks = rotate_body(list_of_landmarks, angle, 'y')
    
    # get box
    shoulder_distance = np.linalg.norm(
        list_of_landmarks[0] - list_of_landmarks[1])
    top_h, bot_h = (4.0/3.0)*shoulder_distance, 1.5*shoulder_distance
    half_w = shoulder_distance*1.5
    
    # check if out bound of box
    if out_bound(list_of_landmarks[4], list_of_landmarks[5], half_w, top_h, bot_h):
        return None, True

    # scale to shoulder size
    list_of_landmarks = scale_body(list_of_landmarks, 200)

    return list_of_landmarks, False
#-----------------------------------------------------------------------------------------------------------------

def extract_keypoints(res_holistic):
    
    if (not res_holistic.pose_landmarks): return np.zeros((12*3 + 42*3,)), 'CAN NOT DECTECT WHOLE'
    #extract and normalize pose_landmarks (just shoulder and arms 11->22)
    pose_landmarks = np.array([[
                                res_holistic.pose_landmarks.landmark[i].x,
                                res_holistic.pose_landmarks.landmark[i].y,
                                res_holistic.pose_landmarks.landmark[i].z,
                            ] for i in range(11,23)])
    pose_landmarks, isOutBound = normalized_body(pose_landmarks)
    # check wrist out bound of box
    if isOutBound:
        return np.zeros((12*3 + 42*3,)), 'OUT'
    #extract and normalize hand_landmarks
    if not res_holistic.left_hand_landmarks and not res_holistic.right_hand_landmarks:
        return np.zeros((12*3 + 42*3,)), 'NOT DETECT BOTH HANDS'
    hand_landmarks = {'Left':np.zeros((21,3),dtype=np.double),'Right':np.zeros((21,3),dtype=np.double)}
    if res_holistic.left_hand_landmarks:
        hand_landmarks['Left'] = np.array([[landmark.x,landmark.y,landmark.z] for landmark in res_holistic.left_hand_landmarks.landmark],dtype=np.double)
        hand_landmarks['Left'] = normalized_hand(hand_landmarks['Left'])

    if res_holistic.right_hand_landmarks:
        hand_landmarks['Right'] = np.array([[landmark.x,landmark.y,landmark.z] for landmark in res_holistic.right_hand_landmarks.landmark],dtype=np.double)
        hand_landmarks['Right'] = normalized_hand(hand_landmarks['Right'])

    return np.concatenate((pose_landmarks,hand_landmarks['Left'], hand_landmarks['Right']), axis = None), None


def feed():
    '''
    Task of feed thread
    '''
    video_reader =  cv2.VideoCapture(0)
    # video_reader =  cv2.VideoCapture(os.path.join(os.pardir,'dataset','DataSet','often','d7.mp4'))
    #Init
    time_seq_feature = []
    #Loop    
    while video_reader.isOpened():
        success, frame = video_reader.read()
        if not success:
            break
        #process
        scale = IMAGE_CAM_HEIGHT / frame.shape[0]
        frame = cv2.resize(frame,(IMAGE_CAM_WIDTH, IMAGE_CAM_HEIGHT))
        frame = cv2.flip(frame, 1)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = mp_holistic.process(frame_rgb)
        #Extract
        time_seq_feature.append(extract_keypoints(res)[0])

        #display
        drawLandmarks(frame, res)
        cv2.imshow('video',frame)
        #Put to queue
        if len(time_seq_feature) == SEQ_LEN:
            try:
                sample_queue.put([np.array([time_seq_feature])])
            except Exception as e:
                print('FEED THREAD:',e)
            time_seq_feature = []
        if cv2.waitKey(1)&0xFF == ord('q'):
            break
    #END
    sample_queue.put(None)
    video_reader.release()
    cv2.destroyAllWindows()



def predict(my_model: keras.Model):
    '''
    Task of predict
    '''
    #Loop
    while True:
        try:
            x = sample_queue.get()
        except Exception as e:
            print('PREDICT THREAD:',e)
            continue
        if not x:
            print('PREDICT THREAD: End')
            break
        y = my_model.predict(x[0],verbose=0)
        class_id = np.argmax(y)
        # print('PREDICT THREAD:','predict word','\033[30;31m'+CLASS_LIST[class_id]+'\033[0m'+f': {round(y[0][class_id]*100)}')
        if y[0][class_id] < 0.8: 
            class_id = len(CLASS_LIST) - 1
        print('PREDICT THREAD:','predict word','\033[30;31m'+CLASS_LIST[class_id]+'\033[0m')

if __name__=='__main__':
    my_model = keras.models.load_model(os.path.join(os.pardir,'Model','model_02_06_2025_13_55_1748872509.keras'))
    feed_thread = Thread(target=feed)
    predict_thread = Thread(target=predict, args=(my_model,))
    feed_thread.start()
    predict_thread.start()