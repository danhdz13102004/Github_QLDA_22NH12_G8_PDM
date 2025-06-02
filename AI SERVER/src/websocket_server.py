import asyncio
import websockets
import cv2
import numpy as np
import base64
import mediapipe as mp
from queue import Queue
import tensorflow as tf
from test_model import extract_keypoints, ViTSignLanguageModel, CLASS_LIST, SEQ_LEN, IMAGE_CAM_HEIGHT

# Global queues for inter-thread communication
frame_queue = Queue()  # For storing received frames
feature_queue = Queue()  # For storing extracted features
word_queue = Queue()  # For storing predicted words

async def process_frames():
    """Thread function to process frames and predict signs"""
    time_seq_feature = []
    model = tf.keras.models.load_model('../Model/model_02_06_2025_13_55_1748872509.keras')
    mp_holistic = mp.solutions.holistic.Holistic(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)

    while True:
        if frame_queue.empty():
            await asyncio.sleep(0.01)
            continue

        frame = frame_queue.get()
        if frame is None:
            break

        try:
            # Process frame
            scale = IMAGE_CAM_HEIGHT / frame.shape[0]
            frame = cv2.resize(frame, (int(frame.shape[1]*scale), int(frame.shape[0]*scale)))
            frame = cv2.flip(frame, 1)
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res = mp_holistic.process(frame_rgb)
            #display
            # try:
            #     cv2.imshow('View from app',cv2.resize(frame,(640,480)))
            #     if cv2.waitKey(0.001) & 0xFF == ord('q'):  # Wait 1ms and check if 'q' is pressed to quit
            #         cv2.destroyAllWindows()
            #         break
            # except Exception as e:
            #     print(e)
            #     continue

            # Extract features
            keypoints, _ = extract_keypoints(res)
            time_seq_feature.append(keypoints)

            # When we have enough frames, predict
            if len(time_seq_feature) == SEQ_LEN:
                feature_batch = np.array([time_seq_feature])
                prediction = model.predict(feature_batch, verbose=0)
                predicted_class = np.argmax(prediction[0])

                print(CLASS_LIST[predicted_class])
                
                # Only accept predictions with high confidence
                if prediction[0][predicted_class] >= 0.8:
                    word_queue.put(CLASS_LIST[predicted_class])
                else:
                    word_queue.put("...")  # Use ellipsis for uncertain predictions
                    
                time_seq_feature = time_seq_feature[5:] # Reset for next sequence

        except Exception as e:
            print(f"Error processing frame: {str(e)}")
            continue

async def handle_websocket(websocket):
    """Handle WebSocket connection with the app"""
    print(f"New client connected")
    try:
        async for message in websocket:
            try:
                # Decode base64 image
                img_data = base64.b64decode(message)
                nparr = np.frombuffer(img_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                # Put frame in queue for processing
                frame_queue.put(frame)
                
                # Check for predicted words
                while not word_queue.empty():
                    word = word_queue.get()
                    await websocket.send(word)

            except Exception as e:
                print(f"Error handling message: {str(e)}")
                continue

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    except Exception as e:
        print(f"Error in websocket handler: {str(e)}")
    finally:
        print("Connection closed")

async def main():
    # Start the frame processing task
    process_task = asyncio.create_task(process_frames())

    async with websockets.serve(handle_websocket, "0.0.0.0", 8765):
        print("WebSocket server started on ws://0.0.0.0:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    # Start the server
    print("Starting WebSocket server...")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down server...")
    except Exception as e:
        print(f"Server error: {str(e)}")
    finally:
        # Cleanup
        frame_queue.put(None)  # Signal to stop processing