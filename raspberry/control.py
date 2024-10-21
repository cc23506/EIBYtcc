import time
import cv2
import numpy as np

# Tentando importar RPi.GPIO e substituindo pelo mock em caso de falha (caso não esteja no Raspberry Pi)
try:
    import RPi.GPIO as GPIO
except (ImportError, RuntimeError):
    from mock_gpio import GPIO

# Configurações GPIO
GPIO.setmode(GPIO.BCM)

# Configuração dos pinos da Ponte H (motores DC)
GPIO.setup(17, GPIO.OUT)  # Motor esquerdo IN1
GPIO.setup(18, GPIO.OUT)  # Motor esquerdo IN2
GPIO.setup(23, GPIO.OUT)  # Motor direito IN3
GPIO.setup(24, GPIO.OUT)  # Motor direito IN4

# Configuração do servo motor
servo_pin = 22
GPIO.setup(servo_pin, GPIO.OUT)
servo = GPIO.PWM(servo_pin, 50)  # 50Hz para PWM
servo.start(0)

# Configuração dos servos do braço robótico
servo_arm_pins = [5, 6, 13, 19]
servo_arms = []
for pin in servo_arm_pins:
    GPIO.setup(pin, GPIO.OUT)
    arm_servo = GPIO.PWM(pin, 50)
    servo_arms.append(arm_servo)
    arm_servo.start(0)

# Sensor Ultrassônico HC-SR04
TRIG = 27
ECHO = 22
GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)

status_robot = {
    "status": "parado",
    "product": None
}

def move_robot(direction):
    status_robot["status"] = direction
    if direction == "frente":
        GPIO.output(17, GPIO.HIGH)
        GPIO.output(18, GPIO.LOW)
        GPIO.output(23, GPIO.HIGH)
        GPIO.output(24, GPIO.LOW)
    elif direction == "tras":
        GPIO.output(17, GPIO.LOW)
        GPIO.output(18, GPIO.HIGH)
        GPIO.output(23, GPIO.LOW)
        GPIO.output(24, GPIO.HIGH)
    elif direction == "esquerda":
        GPIO.output(17, GPIO.LOW)
        GPIO.output(18, GPIO.HIGH)
        GPIO.output(23, GPIO.HIGH)
        GPIO.output(24, GPIO.LOW)
    elif direction == "direita":
        GPIO.output(17, GPIO.HIGH)
        GPIO.output(18, GPIO.LOW)
        GPIO.output(23, GPIO.LOW)
        GPIO.output(24, GPIO.HIGH)
    elif direction == "parar":
        GPIO.output(17, GPIO.LOW)
        GPIO.output(18, GPIO.LOW)
        GPIO.output(23, GPIO.LOW)
        GPIO.output(24, GPIO.LOW)
        status_robot["status"] = "parado"

def medir_distancia():
    GPIO.output(TRIG, True)
    time.sleep(0.00001)
    GPIO.output(TRIG, False)

    # Simula a distância
    distance = np.random.uniform(5.0, 200.0)  # Gera uma distância aleatória entre 5 e 200 cm
    return round(distance, 2)

def girar_servo_sensor(angulo):
    duty = 2 + (angulo / 18)
    servo.ChangeDutyCycle(duty)
    time.sleep(0.5)
    servo.ChangeDutyCycle(0)

def mover_braco(angulos):
    for i, angulo in enumerate(angulos):
        duty_cycle = 2 + (angulo / 18)
        servo_arms[i].ChangeDutyCycle(duty_cycle)
        time.sleep(0.5)
        servo_arms[i].ChangeDutyCycle(0)

def parar_robot():
    move_robot("parar")
    status_robot["status"] = "parado"
    status_robot["product"] = None

""" def detectar_objeto(product_name):
    net = cv2.dnn.readNet("yolov3.weights", "yolov3.cfg")
    layer_names = net.getLayerNames()
    output_layers = [layer_names[i[0] - 1] for i in net.getUnconnectedOutLayers()]
    cap = cv2.VideoCapture(0)

    status_robot["status"] = "buscando"
    status_robot["product"] = product_name

    while cap.isOpened():
        ret, frame = cap.read()
        height, width, channels = frame.shape
        blob = cv2.dnn.blobFromImage(frame, 0.00392, (416, 416), (0, 0, 0), True, crop=False)
        net.setInput(blob)
        outs = net.forward(output_layers)

        for out in outs:
            for detection in out:
                scores = detection[5:]
                class_id = np.argmax(scores)
                confidence = scores[class_id]
                if confidence > 0.5:
                    center_x = int(detection[0] * width)
                    center_y = int(detection[1] * height)
                    if center_x < width / 3:
                        move_robot("esquerda")
                    elif center_x > 2 * width / 3:
                        move_robot("direita")
                    else:
                        move_robot("frente")

        cv2.imshow("Camera", frame)
        if cv2.waitKey(1) == 27:
            break

    cap.release()
    cv2.destroyAllWindows()
    parar_robot() """

def detectar_objeto(product_name):
    net = cv2.dnn.readNet("yolov3.weights", "yolov3.cfg")
    layer_names = net.getLayerNames()
    output_layers = [layer_names[i[0] - 1] for i in net.getUnconnectedOutLayers()]
    cap = cv2.VideoCapture(0)

    status_robot["status"] = "detectando"
    status_robot["product"] = product_name

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        height, width, channels = frame.shape

        # Preprocessamento da imagem para a rede YOLO
        blob = cv2.dnn.blobFromImage(frame, 0.00392, (416, 416), (0, 0, 0), True, crop=False)
        net.setInput(blob)
        outs = net.forward(output_layers)

        # Analisando as saídas da rede
        for out in outs:
            for detection in out:
                scores = detection[5:]
                class_id = np.argmax(scores)
                confidence = scores[class_id]

                # Detecta um objeto com confiança maior que 0.5
                if confidence > 0.5:
                    center_x = int(detection[0] * width)
                    center_y = int(detection[1] * height)
                    w = int(detection[2] * width)
                    h = int(detection[3] * height)

                    # Desenha o retângulo ao redor do objeto detectado
                    x = int(center_x - w / 2)
                    y = int(center_y - h / 2)
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

        # Exibe o frame com os objetos detectados
        cv2.imshow("Camera", frame)

        # Interrompe o loop se a tecla 'ESC' for pressionada
        if cv2.waitKey(1) == 27:
            break

    cap.release()
    cv2.destroyAllWindows()
    
    # Atualiza o status do robô
    status_robot["status"] = "parado"
    status_robot["product"] = None


if __name__ == "__main__":
    try:
        while True:
            dist = medir_distancia()
            print(f"Distância: {dist} cm")
            time.sleep(1)
    except KeyboardInterrupt:
        GPIO.cleanup()
