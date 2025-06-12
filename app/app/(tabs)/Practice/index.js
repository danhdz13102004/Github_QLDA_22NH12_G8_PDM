// Practice/index.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { API_ENDPOINTS, API_BASE_URL } from '../../../constants/ApiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogBox } from 'react-native';

// Ẩn tất cả warning (không khuyến khích cho debug thực tế)
LogBox.ignoreAllLogs(true);
export default function PracticeScreen() {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);

  // Add new state variables
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [token, setToken] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const videoRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Check for authentication token
  useEffect(() => {
    const checkToken = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        setToken(userToken);
      } catch (error) {
        console.error('Error checking authentication token:', error);
      }
    };

    checkToken();
  }, []);

  // Reset video and load new one when question changes
  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions[currentQuestionIndex]) {
      console.log(`Loading video for question ${currentQuestionIndex + 1}`);
      setVideoLoading(true);
      setVideoError(false);

      // Small delay to ensure component is updated
      setTimeout(() => {
        setVideoLoading(false);
      }, 300);
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    // Fetch quiz questions from API
    fetchQuiz();
  }, []);
  const fetchQuiz = async () => {
    try {
      setLoading(true);

      // Determine which endpoint to use based on authentication
      const endpoint = API_ENDPOINTS.QUIZ_RANDOM ;
      console.log('Fetching quiz from:', endpoint);

      const headers = {
        'Content-Type': 'application/json',
      };



      const response = await fetch(endpoint, {
        method: 'GET'
      });

      const data = await response.json();
      console.log('Quiz API response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch quiz');
      }

      if (!data.data || !data.data.questions || data.data.questions.length === 0) {
        throw new Error('No quiz questions available');
      }

      setQuiz(data.data);
      setCurrentQuestionIndex(0);
      setSelectedOptions({});
      setQuizCompleted(false);
      setResults(null);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load quiz questions');
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced handleSelectOption with feedback
  const handleSelectOption = (questionId, optionIndex) => {
    // Prevent changing answer after feedback is shown
    if (showFeedback) return;

    setSelectedOptions({
      ...selectedOptions,
      [questionId]: optionIndex
    });

    // Show feedback for 1.5 seconds before allowing to proceed
    // setShowFeedback(true);

    // Animate feedback
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();

    // Auto-hide feedback after delay
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setShowFeedback(false);
      });
    }, 1500);
  };

  const isOptionSelected = (questionId, optionIndex) => {
    return selectedOptions[questionId] === optionIndex;
  };
  // Add video handling functions
  const handleVideoLoad = () => {
    console.log('Video loaded successfully');
    setVideoLoading(false);
    setVideoError(false);
  };

  const handleVideoError = (error) => {
    console.error('Video loading error:', error);
    setVideoLoading(false);
    setVideoError(true);
  };
  const retryVideo = () => {
    if (videoRef.current) {
      setVideoLoading(true);
      setVideoError(false);

      // Properly unload and reload the video
      videoRef.current.unloadAsync()
        .then(() => {
          // Small delay to ensure unload completes
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.loadAsync(getVideoSource(currentQuestion))
                .catch(err => {
                  console.error('Error reloading video:', err);
                  setVideoError(true);
                  setVideoLoading(false);
                });
            }
          }, 300);
        })
        .catch(err => {
          console.error('Error unloading video:', err);
          setVideoError(true);
          setVideoLoading(false);
        });
    }
  };
  // Enhanced navigation functions  
  const goToNextQuestion = () => {
    // Reset feedback state
    setShowFeedback(false);
    fadeAnim.setValue(0);

    if (currentQuestionIndex < quiz.questions.length - 1) {
      // First set loading to true
      setVideoLoading(true);
      setVideoError(false);

      // Reset video ref if needed
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(err => console.log('Error unloading video:', err));
      }

      // Then change the question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Last question, show review screen instead of submitting
      setShowReviewScreen(true);
    }
  };
  const goToPreviousQuestion = () => {
    // Reset feedback state
    setShowFeedback(false);
    fadeAnim.setValue(0);

    if (currentQuestionIndex > 0) {
      // First set loading to true
      setVideoLoading(true);
      setVideoError(false);

      // Reset video ref if needed
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(err => console.log('Error unloading video:', err));
      }

      // Then change the question
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitQuiz = async () => {
    try {
      setLoading(true);

      // Prepare answers for submission
      const answers = Object.keys(selectedOptions).map(questionId => {
        const question = quiz.questions.find(q => q.questionId.toString() === questionId);
        const selectedOptionIndex = selectedOptions[questionId];

        return {
          questionId: parseInt(questionId),
          selectedOptionIndex,
          correctOptionIndex: question.correctOptionIndex,
          isCorrect: selectedOptionIndex === question.correctOptionIndex
        };
      });

      // Check if user is authenticated and token is valid
      if (token) {
        try {
          // Validate token before making request
          const tokenValidation = await AsyncStorage.getItem('userToken');
          if (!tokenValidation || tokenValidation !== token) {
            throw new Error('Token validation failed');
          }

          // Submit to server for authenticated users
          const response = await fetch(API_ENDPOINTS.QUIZ_SUBMIT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              quizId: quiz.quizId,
              answers
            })
          });

          const data = await response.json();

          if (!response.ok) {
            // If token is invalid, clear it and fallback to local calculation
            if (response.status === 401 || response.status === 403) {
              console.log('Token expired or invalid, clearing token and using local calculation');
              await AsyncStorage.removeItem('userToken');
              setToken(null);
              throw new Error('Authentication failed - using local calculation');
            }
            throw new Error(data.message || 'Failed to submit quiz answers');
          }

          setResults(data.data);
        } catch (submitError) {
          console.error('Error submitting to server:', submitError);
          // Fall back to local calculation on any error
          calculateLocalResults();
        }
      } else {
        // Calculate locally for unauthenticated users
        calculateLocalResults();
      }

      setQuizCompleted(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to process quiz answers');
      console.error('Error processing quiz:', error);
      // Ensure we still show results even if there's an error
      if (!results) {
        calculateLocalResults();
        setQuizCompleted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate results locally
  const calculateLocalResults = () => {
    const answers = Object.keys(selectedOptions).map(questionId => {
      const question = quiz.questions.find(q => q.questionId.toString() === questionId);
      const selectedOptionIndex = selectedOptions[questionId];

      return {
        questionId: parseInt(questionId),
        selectedOptionIndex,
        correctOptionIndex: question.correctOptionIndex,
        isCorrect: selectedOptionIndex === question.correctOptionIndex
      };
    });

    const correctAnswers = answers.filter(answer => answer.isCorrect);
    const score = {
      total: answers.length,
      correct: correctAnswers.length,
      percentage: Math.round((correctAnswers.length / answers.length) * 100)
    };

    setResults({
      quizId: quiz.quizId,
      score,
      answers
    });
  };
  const startNewQuiz = () => {
    fetchQuiz();
  };

  // Add function to go back to quiz from review screen
  const backToQuiz = () => {
    setShowReviewScreen(false);
  };

  // Add function to handle submission from review screen
  const handleSubmitFromReview = () => {
    submitQuiz();
    setShowReviewScreen(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c5ce7" />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (quizCompleted && results) {
    // Render results screen
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.resultsContainer}>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreTitle}>Quiz Results</Text>
              <View style={styles.scoreCircle}>
                <Text style={styles.scorePercentage}>
                  {results.score && results.score.percentage !== undefined ? `${results.score.percentage}%` : '0%'}
                </Text>
                <Text style={styles.scoreText}>
                  {results.score ? `${results.score.correct}/${results.score.total}` : '0/0'}
                </Text>
              </View>
              <Text style={styles.scoreMessage}>
                {results.score && results.score.percentage >= 80 ? 'Great job!' :
                  results.score && results.score.percentage >= 60 ? 'Good effort!' : 'Keep practicing!'}
              </Text>
            </View>

            <View style={styles.answerSummary}>
              <Text style={styles.summaryTitle}>Answer Summary</Text>
              {results.answers && results.answers.map((answer) => {
                const question = quiz && quiz.questions ? quiz.questions.find(q => q.questionId === answer.questionId) : null;
                if (!question) return null;

                return (
                  <View key={answer.questionId} style={styles.answerItem}>
                    <View style={styles.answerHeader}>
                      <Ionicons
                        name={answer.isCorrect ? "checkmark-circle" : "close-circle"}
                        size={24}
                        color={answer.isCorrect ? "#4CAF50" : "#F44336"}
                      />
                      <Text style={styles.answerQuestion}>
                        Question {answer.questionId}
                      </Text>
                    </View>
                    <View style={styles.answerDetails}>
                      <Text style={styles.answerText}>
                        Your answer: {question.options && question.options[answer.selectedOptionIndex]
                          ? question.options[answer.selectedOptionIndex].gestureName
                          : "Unknown"}
                      </Text>

                      {!answer.isCorrect && question.options && question.options[answer.correctOptionIndex] && (
                        <Text style={styles.correctAnswerText}>
                          Correct answer: {question.options[answer.correctOptionIndex].gestureName}
                        </Text>
                      )}

                      <Text style={styles.videoNameText}>
                        Video: {question.video ? question.video.title : "Unknown"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
            
            <TouchableOpacity
              style={styles.newQuizButton}
              onPress={startNewQuiz}
            >
              <Text style={styles.newQuizButtonText}>Take Another Quiz</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#6c5ce7" />
          <Text style={styles.errorText}>No quiz questions available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQuiz}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  // Render Review Screen
  if (showReviewScreen && quiz && quiz.questions) {
    const answeredQuestions = Object.keys(selectedOptions).length;
    const totalQuestions = quiz.questions.length;
    const allQuestionsAnswered = answeredQuestions === totalQuestions;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Review Your Answers</Text>
          <Text style={styles.progressText}>
            {answeredQuestions} of {totalQuestions} questions answered
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.reviewContainer}>
            <Text style={styles.reviewInstructions}>
              Review your answers before submitting the quiz. You can go back to change any answer.
            </Text>

            {quiz.questions.map((question, index) => {
              const isAnswered = selectedOptions[question.questionId] !== undefined;
              const selectedOption = isAnswered ?
                question.options[selectedOptions[question.questionId]].gestureName :
                "Not answered";

              return (
                <View key={question.questionId} style={styles.reviewItem}>
                  <View style={styles.reviewItemHeader}>
                    <Text style={styles.reviewItemNumber}>Question {index + 1}</Text>
                    <View style={[
                      styles.reviewItemStatus,
                      isAnswered ? styles.reviewItemAnswered : styles.reviewItemUnanswered
                    ]}>
                      <Text style={styles.reviewItemStatusText}>
                        {isAnswered ? "Answered" : "Not Answered"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.reviewItemContent}>
                    <Text style={styles.reviewItemQuestion}>What sign is shown in the video?</Text>
                    <Text style={styles.reviewItemAnswer}>
                      Your answer: <Text style={isAnswered ? styles.reviewItemAnswerText : styles.reviewItemNotAnsweredText}>
                        {selectedOption}
                      </Text>
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.reviewItemButton}
                    onPress={() => {
                      setCurrentQuestionIndex(index);
                      setShowReviewScreen(false);
                    }}
                  >
                    <Text style={styles.reviewItemButtonText}>
                      {isAnswered ? "Change Answer" : "Answer Question"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            <View style={styles.reviewButtonsContainer}>
              <TouchableOpacity
                style={styles.reviewBackButton}
                onPress={backToQuiz}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
                <Text style={styles.reviewButtonText}>Back to Quiz</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.reviewSubmitButton,
                  !allQuestionsAnswered && styles.reviewSubmitButtonDisabled
                ]}
                onPress={handleSubmitFromReview}
                disabled={!allQuestionsAnswered}
              >
                <Text style={styles.reviewButtonText}>Submit Quiz</Text>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {!allQuestionsAnswered && (
              <Text style={styles.reviewWarning}>
                Please answer all questions before submitting the quiz.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  // Render quiz questions
  if (!quiz || !quiz.questions || !quiz.questions[currentQuestionIndex]) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#6c5ce7" />
          <Text style={styles.errorText}>Failed to load question data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQuiz}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isCorrect = selectedOptions[currentQuestion.questionId] === currentQuestion.correctOptionIndex;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practice ASL</Text>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>
            What sign is shown in this video?
          </Text>

          <View style={styles.videoContainer}>
            {videoLoading && (
              <View style={styles.videoLoadingContainer}>
                <ActivityIndicator size="large" color="#6c5ce7" />
                <Text style={styles.videoLoadingText}>Loading video...</Text>
              </View>
            )}

            {videoError && (
              <View style={styles.videoErrorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
                <Text style={styles.videoErrorText}>Failed to load video</Text>
                <TouchableOpacity style={styles.retryVideoButton} onPress={retryVideo}>
                  <Text style={styles.retryVideoButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {currentQuestion.video && (
              <Video
                ref={videoRef}
                key={`video-${currentQuestionIndex}`}
                source={getVideoSource(currentQuestion)}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode="contain"
                shouldPlay
                isLooping
                useNativeControls
                style={[styles.video, videoLoading && { opacity: 0 }]}
                onLoadStart={() => {
                  console.log('Video load started');
                  setVideoLoading(true);
                }}
                onLoad={handleVideoLoad}
                onError={(error) => handleVideoError(error)}
              />
            )}
          </View>
          <View style={styles.optionsContainer}>
            {currentQuestion.options && currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  isOptionSelected(currentQuestion.questionId, index) && styles.selectedOption,
                  showFeedback && isOptionSelected(currentQuestion.questionId, index) && (
                    index === currentQuestion.correctOptionIndex
                      ? styles.correctOption
                      : styles.incorrectOption
                  )
                ]}
                onPress={() => handleSelectOption(currentQuestion.questionId, index)}
              ><Text
                style={[
                  styles.optionText,
                  isOptionSelected(currentQuestion.questionId, index) && styles.selectedOptionText,
                  showFeedback && isOptionSelected(currentQuestion.questionId, index) && (
                    index === currentQuestion.correctOptionIndex
                      ? styles.correctOptionText
                      : styles.incorrectOptionText
                  )
                ]}
              >
                  {option.gestureName ?? 'Unknown Gesture'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Feedback message */}
          {showFeedback && selectedOptions[currentQuestion.questionId] !== undefined && (
            <Animated.View
              style={[
                styles.feedbackContainer,
                { opacity: fadeAnim },
                isCorrect ? styles.correctFeedback : styles.incorrectFeedback
              ]}
            >
              <Ionicons
                name={isCorrect ? "checkmark-circle" : "close-circle"}
                size={24}
                color={isCorrect ? "#4CAF50" : "#F44336"}
              />                <Text style={styles.feedbackText}>
                {isCorrect
                  ? "Correct! Well done!"
                  : (currentQuestion && currentQuestion.options && currentQuestion.correctOptionIndex !== undefined)
                    ? `Incorrect. The correct answer is "${currentQuestion.options[currentQuestion.correctOptionIndex].gestureName}"`
                    : "Incorrect. Please try again."
                }
              </Text>
            </Animated.View>
          )}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navigationButton, currentQuestionIndex === 0 && styles.navigationButtonDisabled]}
              onPress={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            {currentQuestionIndex === quiz.questions.length - 1 ? (<TouchableOpacity
              style={[styles.navigationButton, styles.reviewButton]}
              onPress={() => setShowReviewScreen(true)}
            >
              {/* <Text style={styles.reviewButtonText}>Review</Text> */}
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.navigationButton}
                onPress={goToNextQuestion}
              >
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Add new styles for video handling and feedback
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 16,
    backgroundColor: '#6c5ce7',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressText: {
    fontSize: 16,
    color: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6c5ce7',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  questionContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoLoadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#f0edff',
    borderRadius: 15,
    zIndex: 1,
  },
  videoLoadingText: {
    marginTop: 10,
    color: '#6c5ce7',
    fontWeight: '500',
  },
  videoErrorContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff0f0',
    borderRadius: 15,
    zIndex: 1,
  },
  videoErrorText: {
    marginTop: 10,
    color: '#e74c3c',
    fontWeight: '500',
    marginBottom: 10,
  },
  retryVideoButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryVideoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  optionsContainer: {
    marginTop: 16,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedOption: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
  correctOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  incorrectOption: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  correctOptionText: {
    color: '#fff',
  },
  incorrectOptionText: {
    color: '#fff',
  },
  feedbackIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
    top: 12,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navigationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6c5ce7',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navigationButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6c5ce7',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreText: {
    fontSize: 16,
    color: '#fff',
  },
  scoreMessage: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  answerSummary: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  answerItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerQuestion: {
    fontSize: 16,
    color: '#333',
  },
  answerDetails: {
    marginLeft: 32,
  },
  answerText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 4,
  },
  videoNameText: {
    fontSize: 14,
    color: '#666',
  },
  newQuizButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newQuizButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  historyButton: {
    backgroundColor: '#5b52b5',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#6c5ce7',
    borderRadius: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  // New styles for feedback message
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  correctFeedback: {
    backgroundColor: '#e8f5e9',
  },
  incorrectFeedback: {
    backgroundColor: '#fce8e6',
  },
  feedbackText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 8,
    backgroundColor: '#6c5ce7',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  navButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  disabledButtonText: {
    color: '#ccc',
  },

  // New styles for Review Screen
  reviewContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewInstructions: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  reviewItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewItemNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewItemStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  reviewItemAnswered: {
    backgroundColor: '#e3f2fd',
  },
  reviewItemUnanswered: {
    backgroundColor: '#ffebee',
  },
  reviewItemStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reviewItemContent: {
    marginBottom: 12,
  },
  reviewItemQuestion: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
  reviewItemAnswer: {
    fontSize: 15,
    color: '#666',
  },
  reviewItemAnswerText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  reviewItemNotAnsweredText: {
    color: '#F44336',
    fontStyle: 'italic',
  },
  reviewItemButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  reviewItemButtonText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  reviewButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  reviewBackButton: {
    backgroundColor: '#5b52b5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  reviewSubmitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  reviewSubmitButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  reviewButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginHorizontal: 6,
  },
  reviewWarning: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  reviewButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
// Function to get the appropriate video source based on the question
const getVideoSource = (question) => {
  // For debugging - log the question structure to understand its properties
  console.log('Question data for video source:', JSON.stringify(question, null, 2));
  // return require('../../../assets/videos/thank.mp4');
  // If using API endpoint videos (uncomment this if your API is working)
  // Try to find a match based on different properties
  let videoKey = '';

  if (question.video && question.video.filePath) {
    const filePath = question.video.filePath;

    // Tách path thành các phần (hỗ trợ cả \ và /)
    const parts = filePath.split(/[\\/]/);

    if (parts.length >= 2) {
      videoKey = parts[parts.length - 2].toLowerCase(); // chỉ lấy tên folder
    }

    console.log('Using video from API path:', filePath);
    console.log('Extracted video key:', videoKey);
  }


  // For local videos, map based on the gesture name or title
const videoMapping = {
  'again': require('../../../assets/videos/again.mp4'),
  'airplane': require('../../../assets/videos/airplane.mp4'),
  'always': require('../../../assets/videos/always.mp4'),
  'bad': require('../../../assets/videos/bad.mp4'),
  'beautiful': require('../../../assets/videos/beautiful.mp4'),
  'big': require('../../../assets/videos/big.mp4'),
  'book': require('../../../assets/videos/book.mp4'),
  'brother': require('../../../assets/videos/brother.mp4'),
  'bus': require('../../../assets/videos/bus.mp4'),
  'buy': require('../../../assets/videos/buy.mp4'),
  'car': require('../../../assets/videos/car.mp4'),
  'child': require('../../../assets/videos/child.mp4'),
  'come': require('../../../assets/videos/come.mp4'),
  'day': require('../../../assets/videos/day.mp4'),
  'different': require('../../../assets/videos/different.mp4'),
  'doctor': require('../../../assets/videos/doctor.mp4'),
  'door': require('../../../assets/videos/door.mp4'),
  'drink': require('../../../assets/videos/drink.mp4'),
  'eat': require('../../../assets/videos/eat.mp4'),
  'family': require('../../../assets/videos/family.mp4'),
  'father': require('../../../assets/videos/father.mp4'),
  'finish': require('../../../assets/videos/finish.mp4'),
  'food': require('../../../assets/videos/food.mp4'),
  'friend': require('../../../assets/videos/friend.mp4'),
  'go': require('../../../assets/videos/go.mp4'),
  'good': require('../../../assets/videos/good.mp4'),
  'goodbye': require('../../../assets/videos/goodbye.mp4'),
  'happy': require('../../../assets/videos/happy.mp4'),
  'hello': require('../../../assets/videos/hello.mp4'),
  'help': require('../../../assets/videos/help.mp4'),
  'home': require('../../../assets/videos/home.mp4'),
  'hospital': require('../../../assets/videos/hospital.mp4'),
  'hot': require('../../../assets/videos/hot.mp4'),
  'house': require('../../../assets/videos/house.mp4'),
  'i': require('../../../assets/videos/i.mp4'),
  'jump': require('../../../assets/videos/jump.mp4'),
  'later': require('../../../assets/videos/later.mp4'),
  'learn': require('../../../assets/videos/learn.mp4'),
  'life': require('../../../assets/videos/life.mp4'),
  'listen': require('../../../assets/videos/listen.mp4'),
  'love': require('../../../assets/videos/love.mp4'),
  'money': require('../../../assets/videos/money.mp4'),
  'month': require('../../../assets/videos/month.mp4'),
  'morning': require('../../../assets/videos/morning.mp4'),
  'name': require('../../../assets/videos/name.mp4'),
  'mother': require('../../../assets/videos/mother.mp4'),
  'need': require('../../../assets/videos/need.mp4'),
  'never': require('../../../assets/videos/never.mp4'),
  'new': require('../../../assets/videos/new.mp4'),
  'night': require('../../../assets/videos/night.mp4'),
  'no': require('../../../assets/videos/no.mp4'),
  'now': require('../../../assets/videos/now.mp4'),
  'often': require('../../../assets/videos/often.mp4'),
  'parent': require('../../../assets/videos/parent.mp4'),
  'play': require('../../../assets/videos/play.mp4'),
  'please': require('../../../assets/videos/please.mp4'),
  'read': require('../../../assets/videos/read.mp4'),
  'room': require('../../../assets/videos/room.mp4'),
  'sad': require('../../../assets/videos/sad.mp4'),
  'school': require('../../../assets/videos/school.mp4'),
  'sell': require('../../../assets/videos/sell.mp4'),
  'sick': require('../../../assets/videos/sick.mp4'),
  'sister': require('../../../assets/videos/sister.mp4'),
  'sleep': require('../../../assets/videos/sleep.mp4'),
  'small': require('../../../assets/videos/small.mp4'),
  'sometimes': require('../../../assets/videos/sometimes.mp4'),
  'sorry': require('../../../assets/videos/sorry.mp4'),
  'speak': require('../../../assets/videos/speak.mp4'),
  'stand': require('../../../assets/videos/stand.mp4'),
  'start': require('../../../assets/videos/start.mp4'),
  'stop': require('../../../assets/videos/stop.mp4'),
  'student': require('../../../assets/videos/student.mp4'),
  'teach': require('../../../assets/videos/teach.mp4'),
  'teacher': require('../../../assets/videos/teacher.mp4'),
  'thank': require('../../../assets/videos/thank.mp4'),
  'time': require('../../../assets/videos/time.mp4'),
  'today': require('../../../assets/videos/today.mp4'),
  'tomorrow': require('../../../assets/videos/tomorrow.mp4'),
  'train': require('../../../assets/videos/train.mp4'),
  'travel': require('../../../assets/videos/travel.mp4'),
  'ugly': require('../../../assets/videos/ugly.mp4'),
  'walk': require('../../../assets/videos/walk.mp4'),
  'want': require('../../../assets/videos/want.mp4'),
  'water': require('../../../assets/videos/water.mp4'),
  'week': require('../../../assets/videos/week.mp4'),
  'what': require('../../../assets/videos/what.mp4'),
  'where': require('../../../assets/videos/where.mp4'),
  'window': require('../../../assets/videos/window.mp4'),
  'work': require('../../../assets/videos/work.mp4'),
  'write': require('../../../assets/videos/write.mp4'),
  'year': require('../../../assets/videos/year.mp4'),
  'yesterday': require('../../../assets/videos/yesterday.mp4'),
  'you': require('../../../assets/videos/you.mp4'),
  'young': require('../../../assets/videos/young.mp4'),
};

  if (videoMapping[videoKey]) {
    return videoMapping[videoKey];
  }


  return require('../../../assets/videos/hello.mp4');

};
