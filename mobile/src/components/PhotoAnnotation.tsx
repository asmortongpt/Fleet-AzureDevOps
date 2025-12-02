/**
 * Fleet Mobile Photo Annotation Component
 *
 * Interactive photo annotation with drawing tools (arrow, circle, rectangle,
 * freehand, text, markers), undo/redo functionality, and color/size selection
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  PanResponder,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import Svg, {
  Line,
  Circle as SvgCircle,
  Rect,
  Path,
  Text as SvgText,
  Defs,
  Marker as SvgMarker,
  Polygon,
} from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import {
  PhotoAnnotationProps,
  Annotation,
  AnnotationType,
  AnnotationPoint,
  ArrowAnnotation,
  CircleAnnotation,
  RectangleAnnotation,
  FreehandAnnotation,
  TextAnnotation,
  MarkerAnnotation,
  AnnotatedPhoto,
} from '../types';

const { width, height } = Dimensions.get('window');

const TOOL_OPTIONS: { type: AnnotationType; label: string; icon: string }[] = [
  { type: AnnotationType.ARROW, label: 'Arrow', icon: '→' },
  { type: AnnotationType.CIRCLE, label: 'Circle', icon: '○' },
  { type: AnnotationType.RECTANGLE, label: 'Rectangle', icon: '▭' },
  { type: AnnotationType.FREEHAND, label: 'Draw', icon: '✏️' },
  { type: AnnotationType.TEXT, label: 'Text', icon: 'T' },
  { type: AnnotationType.MARKER, label: 'Marker', icon: '📍' },
];

const COLOR_OPTIONS = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#FFFFFF', // White
  '#000000', // Black
];

const STROKE_WIDTH_OPTIONS = [2, 4, 6, 8, 10];

export const PhotoAnnotation: React.FC<PhotoAnnotationProps> = ({
  photo,
  existingAnnotations = [],
  onSave,
  onCancel,
  readOnly = false,
}) => {
  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation[]>(existingAnnotations);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);

  // Tool state
  const [selectedTool, setSelectedTool] = useState<AnnotationType>(
    AnnotationType.ARROW
  );
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState(4);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [startPoint, setStartPoint] = useState<AnnotationPoint | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<AnnotationPoint[]>([]);

  // Text annotation state
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [textPosition, setTextPosition] = useState<AnnotationPoint | null>(null);
  const [fontSize, setFontSize] = useState(16);

  // UI state
  const [showToolbar, setShowToolbar] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokeWidthPicker, setShowStrokeWidthPicker] = useState(false);

  const viewShotRef = useRef<ViewShot>(null);
  const imageSize = useRef({ width: 0, height: 0 });

  // ============================================================================
  // Pan Responder for Drawing
  // ============================================================================

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !readOnly,
      onMoveShouldSetPanResponder: () => !readOnly,

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const point: AnnotationPoint = { x: locationX, y: locationY };

        if (selectedTool === AnnotationType.TEXT) {
          setTextPosition(point);
          setShowTextInput(true);
          return;
        }

        if (selectedTool === AnnotationType.MARKER) {
          addMarker(point);
          return;
        }

        setIsDrawing(true);
        setStartPoint(point);
        setFreehandPoints([point]);
      },

      onPanResponderMove: (evt) => {
        if (!isDrawing || !startPoint) return;

        const { locationX, locationY } = evt.nativeEvent;
        const currentPoint: AnnotationPoint = { x: locationX, y: locationY };

        if (selectedTool === AnnotationType.FREEHAND) {
          setFreehandPoints((prev) => [...prev, currentPoint]);
        } else {
          updateCurrentAnnotation(startPoint, currentPoint);
        }
      },

      onPanResponderRelease: () => {
        if (!isDrawing || !startPoint) return;

        if (selectedTool === AnnotationType.FREEHAND && freehandPoints.length > 1) {
          finalizeAnnotation();
        } else if (currentAnnotation) {
          finalizeAnnotation();
        }

        setIsDrawing(false);
        setStartPoint(null);
        setFreehandPoints([]);
        setCurrentAnnotation(null);
      },
    })
  ).current;

  // ============================================================================
  // Annotation Creation
  // ============================================================================

  const updateCurrentAnnotation = (
    start: AnnotationPoint,
    end: AnnotationPoint
  ) => {
    let annotation: Annotation | null = null;

    switch (selectedTool) {
      case AnnotationType.ARROW:
        annotation = {
          id: `annotation_${Date.now()}`,
          type: AnnotationType.ARROW,
          color: selectedColor,
          strokeWidth,
          timestamp: new Date(),
          start,
          end,
        } as ArrowAnnotation;
        break;

      case AnnotationType.CIRCLE:
        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        annotation = {
          id: `annotation_${Date.now()}`,
          type: AnnotationType.CIRCLE,
          color: selectedColor,
          strokeWidth,
          timestamp: new Date(),
          center: start,
          radius,
        } as CircleAnnotation;
        break;

      case AnnotationType.RECTANGLE:
        annotation = {
          id: `annotation_${Date.now()}`,
          type: AnnotationType.RECTANGLE,
          color: selectedColor,
          strokeWidth,
          timestamp: new Date(),
          topLeft: start,
          bottomRight: end,
        } as RectangleAnnotation;
        break;
    }

    setCurrentAnnotation(annotation);
  };

  const addMarker = (position: AnnotationPoint) => {
    const annotation: MarkerAnnotation = {
      id: `annotation_${Date.now()}`,
      type: AnnotationType.MARKER,
      color: selectedColor,
      strokeWidth,
      timestamp: new Date(),
      position,
      label: `${annotations.length + 1}`,
    };

    addAnnotation(annotation);
  };

  const addTextAnnotation = () => {
    if (!textInputValue.trim() || !textPosition) {
      setShowTextInput(false);
      return;
    }

    const annotation: TextAnnotation = {
      id: `annotation_${Date.now()}`,
      type: AnnotationType.TEXT,
      color: selectedColor,
      strokeWidth,
      timestamp: new Date(),
      position: textPosition,
      text: textInputValue,
      fontSize,
    };

    addAnnotation(annotation);
    setShowTextInput(false);
    setTextInputValue('');
    setTextPosition(null);
  };

  const finalizeAnnotation = () => {
    if (selectedTool === AnnotationType.FREEHAND && freehandPoints.length > 1) {
      const annotation: FreehandAnnotation = {
        id: `annotation_${Date.now()}`,
        type: AnnotationType.FREEHAND,
        color: selectedColor,
        strokeWidth,
        timestamp: new Date(),
        points: freehandPoints,
      };
      addAnnotation(annotation);
    } else if (currentAnnotation) {
      addAnnotation(currentAnnotation);
    }
  };

  const addAnnotation = (annotation: Annotation) => {
    saveToUndoStack();
    setAnnotations((prev) => [...prev, annotation]);
    setRedoStack([]); // Clear redo stack when new annotation is added
  };

  // ============================================================================
  // Undo/Redo Functionality
  // ============================================================================

  const saveToUndoStack = () => {
    setUndoStack((prev) => [...prev, annotations]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, annotations]);
    setAnnotations(previousState);
    setUndoStack((prev) => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    saveToUndoStack();
    setAnnotations(nextState);
    setRedoStack((prev) => prev.slice(0, -1));
  };

  const clearAll = () => {
    Alert.alert(
      'Clear All Annotations',
      'Are you sure you want to remove all annotations?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            saveToUndoStack();
            setAnnotations([]);
            setRedoStack([]);
          },
        },
      ]
    );
  };

  // ============================================================================
  // Save Functionality
  // ============================================================================

  const saveAnnotations = async () => {
    try {
      // Capture annotated image
      const uri = await viewShotRef.current?.capture?.();

      if (!uri) {
        Alert.alert('Error', 'Failed to save annotated photo');
        return;
      }

      const annotatedPhoto: AnnotatedPhoto = {
        ...photo,
        annotations,
        originalPhotoId: photo.id,
        uri,
        id: `annotated_${Date.now()}`,
      };

      onSave(annotatedPhoto);
    } catch (error) {
      console.error('Error saving annotations:', error);
      Alert.alert('Error', 'Failed to save annotated photo');
    }
  };

  // ============================================================================
  // Render Annotations
  // ============================================================================

  const renderAnnotation = (annotation: Annotation) => {
    switch (annotation.type) {
      case AnnotationType.ARROW:
        return renderArrow(annotation as ArrowAnnotation);

      case AnnotationType.CIRCLE:
        return renderCircle(annotation as CircleAnnotation);

      case AnnotationType.RECTANGLE:
        return renderRectangle(annotation as RectangleAnnotation);

      case AnnotationType.FREEHAND:
        return renderFreehand(annotation as FreehandAnnotation);

      case AnnotationType.TEXT:
        return renderText(annotation as TextAnnotation);

      case AnnotationType.MARKER:
        return renderMarker(annotation as MarkerAnnotation);

      default:
        return null;
    }
  };

  const renderArrow = (annotation: ArrowAnnotation) => {
    const { start, end, color, strokeWidth } = annotation;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLength = 15;

    const arrowPoint1 = {
      x: end.x - arrowLength * Math.cos(angle - Math.PI / 6),
      y: end.y - arrowLength * Math.sin(angle - Math.PI / 6),
    };

    const arrowPoint2 = {
      x: end.x - arrowLength * Math.cos(angle + Math.PI / 6),
      y: end.y - arrowLength * Math.sin(angle + Math.PI / 6),
    };

    return (
      <React.Fragment key={annotation.id}>
        <Line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={color}
          strokeWidth={strokeWidth}
        />
        <Polygon
          points={`${end.x},${end.y} ${arrowPoint1.x},${arrowPoint1.y} ${arrowPoint2.x},${arrowPoint2.y}`}
          fill={color}
        />
      </React.Fragment>
    );
  };

  const renderCircle = (annotation: CircleAnnotation) => {
    const { center, radius, color, strokeWidth } = annotation;
    return (
      <SvgCircle
        key={annotation.id}
        cx={center.x}
        cy={center.y}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
    );
  };

  const renderRectangle = (annotation: RectangleAnnotation) => {
    const { topLeft, bottomRight, color, strokeWidth } = annotation;
    return (
      <Rect
        key={annotation.id}
        x={Math.min(topLeft.x, bottomRight.x)}
        y={Math.min(topLeft.y, bottomRight.y)}
        width={Math.abs(bottomRight.x - topLeft.x)}
        height={Math.abs(bottomRight.y - topLeft.y)}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
    );
  };

  const renderFreehand = (annotation: FreehandAnnotation) => {
    const { points, color, strokeWidth } = annotation;
    if (points.length < 2) return null;

    const pathData = points.reduce((path, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `${path} L ${point.x} ${point.y}`;
    }, '');

    return (
      <Path
        key={annotation.id}
        d={pathData}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };

  const renderText = (annotation: TextAnnotation) => {
    const { position, text, color, fontSize } = annotation;
    return (
      <SvgText
        key={annotation.id}
        x={position.x}
        y={position.y}
        fill={color}
        fontSize={fontSize}
        fontWeight="bold"
        stroke="#000"
        strokeWidth={0.5}
      >
        {text}
      </SvgText>
    );
  };

  const renderMarker = (annotation: MarkerAnnotation) => {
    const { position, color, label } = annotation;
    return (
      <React.Fragment key={annotation.id}>
        <SvgCircle
          cx={position.x}
          cy={position.y}
          r={15}
          fill={color}
          stroke="#fff"
          strokeWidth={2}
        />
        {label && (
          <SvgText
            x={position.x}
            y={position.y + 5}
            fill="#fff"
            fontSize={14}
            fontWeight="bold"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        )}
      </React.Fragment>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <View style={styles.container}>
      {/* Annotatable Image */}
      <ViewShot ref={viewShotRef} style={styles.canvasContainer}>
        <Image
          source={{ uri: photo.uri }}
          style={styles.image}
          resizeMode="contain"
          onLayout={(event) => {
            imageSize.current = {
              width: event.nativeEvent.layout.width,
              height: event.nativeEvent.layout.height,
            };
          }}
        />

        <View
          style={StyleSheet.absoluteFill}
          {...(readOnly ? {} : panResponder.panHandlers)}
        >
          <Svg style={StyleSheet.absoluteFill}>
            {/* Render existing annotations */}
            {annotations.map((annotation) => renderAnnotation(annotation))}

            {/* Render current drawing */}
            {isDrawing && currentAnnotation && renderAnnotation(currentAnnotation)}
            {isDrawing &&
              selectedTool === AnnotationType.FREEHAND &&
              freehandPoints.length > 1 &&
              renderFreehand({
                id: 'current',
                type: AnnotationType.FREEHAND,
                color: selectedColor,
                strokeWidth,
                timestamp: new Date(),
                points: freehandPoints,
              } as FreehandAnnotation)}
          </Svg>
        </View>
      </ViewShot>

      {/* Toolbar */}
      {!readOnly && showToolbar && (
        <View style={styles.toolbar}>
          {/* Tool Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.toolsContainer}
            contentContainerStyle={styles.toolsContent}
          >
            {TOOL_OPTIONS.map((tool) => (
              <TouchableOpacity
                key={tool.type}
                style={[
                  styles.toolButton,
                  selectedTool === tool.type && styles.toolButtonSelected,
                ]}
                onPress={() => setSelectedTool(tool.type)}
              >
                <Text style={styles.toolIcon}>{tool.icon}</Text>
                <Text style={styles.toolLabel}>{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Color Picker Button */}
          <TouchableOpacity
            style={[styles.colorButton, { backgroundColor: selectedColor }]}
            onPress={() => setShowColorPicker(!showColorPicker)}
          >
            <Text style={styles.colorButtonText}>🎨</Text>
          </TouchableOpacity>

          {/* Stroke Width Button */}
          <TouchableOpacity
            style={styles.strokeButton}
            onPress={() => setShowStrokeWidthPicker(!showStrokeWidthPicker)}
          >
            <View style={[styles.strokePreview, { height: strokeWidth }]} />
          </TouchableOpacity>
        </View>
      )}

      {/* Color Picker */}
      {showColorPicker && (
        <View style={styles.colorPickerContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorPickerContent}
          >
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => {
                  setSelectedColor(color);
                  setShowColorPicker(false);
                }}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Stroke Width Picker */}
      {showStrokeWidthPicker && (
        <View style={styles.strokePickerContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.strokePickerContent}
          >
            {STROKE_WIDTH_OPTIONS.map((width) => (
              <TouchableOpacity
                key={width}
                style={[
                  styles.strokeOption,
                  strokeWidth === width && styles.strokeOptionSelected,
                ]}
                onPress={() => {
                  setStrokeWidth(width);
                  setShowStrokeWidthPicker(false);
                }}
              >
                <View style={[styles.strokePreview, { height: width }]} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={onCancel}>
          <Text style={styles.controlButtonText}>Cancel</Text>
        </TouchableOpacity>

        {!readOnly && (
          <>
            <TouchableOpacity
              style={[
                styles.controlButton,
                undoStack.length === 0 && styles.controlButtonDisabled,
              ]}
              onPress={undo}
              disabled={undoStack.length === 0}
            >
              <Text style={styles.controlButtonText}>↶ Undo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                redoStack.length === 0 && styles.controlButtonDisabled,
              ]}
              onPress={redo}
              disabled={redoStack.length === 0}
            >
              <Text style={styles.controlButtonText}>↷ Redo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                annotations.length === 0 && styles.controlButtonDisabled,
              ]}
              onPress={clearAll}
              disabled={annotations.length === 0}
            >
              <Text style={styles.controlButtonText}>Clear</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.controlButton, styles.saveButton]}
          onPress={saveAnnotations}
        >
          <Text style={[styles.controlButtonText, styles.saveButtonText]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      {/* Text Input Modal */}
      <Modal
        visible={showTextInput}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTextInput(false)}
      >
        <View style={styles.textInputModal}>
          <View style={styles.textInputContainer}>
            <Text style={styles.textInputTitle}>Add Text</Text>

            <TextInput
              style={styles.textInput}
              placeholder="Enter text..."
              value={textInputValue}
              onChangeText={setTextInputValue}
              autoFocus
              multiline
            />

            <View style={styles.fontSizeSelector}>
              <Text style={styles.fontSizeLabel}>Font Size:</Text>
              {[12, 16, 20, 24, 28].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.fontSizeOption,
                    fontSize === size && styles.fontSizeOptionSelected,
                  ]}
                  onPress={() => setFontSize(size)}
                >
                  <Text style={[styles.fontSizeOptionText, { fontSize: size }]}>
                    A
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.textInputActions}>
              <TouchableOpacity
                style={styles.textInputButton}
                onPress={() => {
                  setShowTextInput(false);
                  setTextInputValue('');
                }}
              >
                <Text style={styles.textInputButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.textInputButton, styles.textInputButtonPrimary]}
                onPress={addTextAnnotation}
              >
                <Text style={styles.textInputButtonTextPrimary}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Annotation Counter */}
      {annotations.length > 0 && (
        <View style={styles.annotationCounter}>
          <Text style={styles.annotationCounterText}>
            {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  toolsContainer: {
    flex: 1,
  },
  toolsContent: {
    paddingHorizontal: 5,
  },
  toolButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    minWidth: 60,
  },
  toolButtonSelected: {
    backgroundColor: '#007AFF',
  },
  toolIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  toolLabel: {
    color: '#fff',
    fontSize: 10,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  colorButtonText: {
    fontSize: 20,
  },
  strokeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  strokePreview: {
    width: 30,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  colorPickerContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 10,
  },
  colorPickerContent: {
    paddingHorizontal: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
    borderWidth: 3,
  },
  strokePickerContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 15,
  },
  strokePickerContent: {
    paddingHorizontal: 10,
  },
  strokeOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  strokeOptionSelected: {
    backgroundColor: '#007AFF',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  controlButtonDisabled: {
    opacity: 0.3,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
  },
  textInputModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  textInputContainer: {
    width: width - 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  textInputTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  fontSizeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  fontSizeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
  },
  fontSizeOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  fontSizeOptionSelected: {
    backgroundColor: '#007AFF',
  },
  fontSizeOptionText: {
    fontWeight: 'bold',
  },
  textInputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textInputButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  textInputButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  textInputButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  textInputButtonTextPrimary: {
    color: '#fff',
  },
  annotationCounter: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  annotationCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PhotoAnnotation;
