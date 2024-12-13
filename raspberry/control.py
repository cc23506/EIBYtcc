import time
import cv2
import numpy as np
import tensorflow as tf

def load_model(model_path):
    with tf.compat.v1.gfile.GFile(model_path, 'rb') as f:
        graph_def = tf.compat.v1.GraphDef()
        graph_def.ParseFromString(f.read())
    with tf.Graph().as_default() as graph:
        tf.import_graph_def(graph_def, name='')
    return graph

def detect_objects(image, sess, tensors):
    input_tensor = np.expand_dims(image, axis=0)
    output_dict = sess.run(tensors, feed_dict={tensors['image_tensor']: input_tensor})
    return output_dict

def draw_boxes(image, boxes, scores, classes):
    height, width, _ = image.shape
    bboxes = []
    for box in boxes:
        ymin, xmin, ymax, xmax = box
        bboxes.append([int(xmin * width), int(ymin * height), int((xmax - xmin) * width), int((ymax - ymin) * height)])

    indices = cv2.dnn.NMSBoxes(
        bboxes,
        scores.tolist(),
        score_threshold=0.6,
        nms_threshold=0.4
    )
    
    if isinstance(indices, np.ndarray) and indices.size > 0:
        for idx in indices.flatten():
            i = idx
            class_id = int(classes[i])
            
            if class_id in [1, 77, 44]:
                xmin, ymin, width, height = bboxes[i]
                xmax, ymax = xmin + width, ymin + height
                cv2.rectangle(image, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2)
                label = ""
                if class_id == 1:
                    label = f"Person: {int(scores[i] * 100)}%"
                elif class_id == 77:
                    label = f"Cell Phone: {int(scores[i] * 100)}%"
                elif class_id == 44:
                    label = f"Bottle: {int(scores[i] * 100)}%"
                cv2.putText(image, label, (xmin, ymin - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)


status_robot = {
    "status": "parado",
    "product": None
}

def calcular_rota(x1, x2, y1, y2):
    status_robot["status"] = "calculando rota"
    print(f"Simulação: Calculando rota para a zona ({x1}, {y1}) até ({x2}, {y2}).")
    time.sleep(1)
    print("Simulação: Cálculo da rota concluída.")
    medir_distancia()
    


def move_robot(direction):
    print(f"Simulação: Movendo o robô para {direction}.")
    status_robot["status"] = direction
    time.sleep(0.5)

def medir_distancia():
    status_robot["status"] = "medindo distância"
    distance = np.random.uniform(5.0, 200.0)
    print(f"Simulação: Medindo distancia: {distance:.2f} cm")
    status_robot["status"] = "Andando"
    return round(distance, 2)


def detectar_objeto(product_name, imageWidth, imageHeight):
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Erro ao abrir a câmera")
        return
    
    status_robot["status"] = "Detectando objeto"
    status_robot["product"] = product_name

    model_path = "raspberry/ssd_mobilenet_v1_coco_2018_01_28/frozen_inference_graph.pb"
    graph = load_model(model_path)

    with tf.compat.v1.Session(graph=graph) as sess:
        tensors = {
            'image_tensor': graph.get_tensor_by_name('image_tensor:0'),
            'detection_boxes': graph.get_tensor_by_name('detection_boxes:0'),
            'detection_scores': graph.get_tensor_by_name('detection_scores:0'),
            'detection_classes': graph.get_tensor_by_name('detection_classes:0')
        }

        while True:
            ret, frame = cap.read()
            if not ret:
                print("Erro ao capturar frame")
                break

            frame = cv2.flip(frame, 1)
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame_rgb = cv2.GaussianBlur(frame_rgb, (5, 5), 0)

            detections = detect_objects(frame_rgb, sess, tensors)
            draw_boxes(frame, detections['detection_boxes'][0], detections['detection_scores'][0], detections['detection_classes'][0])

            cv2.imshow('Webcam - Detecção de Objetos', frame)

            if cv2.waitKey(1) & 0xFF == 27:
                break

            if cv2.getWindowProperty('Webcam - Detecção de Objetos', cv2.WND_PROP_VISIBLE) < 1:
                break

    cap.release()
    cv2.destroyAllWindows()
    parar_robot()

def parar_robot():
    print("Simulação: Parando o robô.")
    move_robot("parar")
    status_robot["status"] = "parado"
    status_robot["product"] = None

if __name__ == "__main__":
    try:
        while True:
            medir_distancia()
            time.sleep(1)
    except KeyboardInterrupt:
        print("Simulação encerrada.")