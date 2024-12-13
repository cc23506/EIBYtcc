# Simulação do código Flask
from flask import Flask, request, jsonify
import control  # Importar o arquivo de controle do robô simulado
import threading

app = Flask(__name__)

def run_robot(product, x1, x2, y1, y2, imageWidth, imageHeight):
    # Adicionar as variáveis imageWidth e imageHeight para processamento no controle do robô
    control.calcular_rota(x1, x2, y1, y2)
    control.detectar_objeto(product, imageWidth, imageHeight)  # Passando as dimensões da imagem

@app.route('/api/control-robot', methods=['POST'])
def control_robot():
    data = request.json
    product = data.get('product')
    requester = data.get('requester')
    zone = data.get('zone')
    imageWidth = data.get('imageWidth')  # Captura a largura da imagem
    imageHeight = data.get('imageHeight')  # Captura a altura da imagem

    if product and zone:
        # Extraia as coordenadas da zona
        x1, x2, y1, y2 = zone["x1"], zone["x2"], zone["y1"], zone["y2"]

        # Inicia a detecção e o movimento do robô em uma nova thread com as coordenadas
        robot_thread = threading.Thread(target=run_robot, args=(product, x1, x2, y1, y2, imageWidth, imageHeight))
        robot_thread.start()
        return jsonify({"success": True, "message": f"Simulação: Buscando '{product}' na zona definida.\n\nPedido por: {requester}"})
    
    return jsonify({"success": False, "message": "Produto ou zona não encontrado."})

@app.route('/api/stop-robot', methods=['POST'])
def stop_robot():
    # Função para parar o robô
    control.parar_robot()
    return jsonify({"success": True, "message": "Simulação: Robô parado."})

@app.route('/api/status-robot', methods=['GET'])
def status_robot():
    # Retorna o status atual do robô
    return jsonify({
        "status": control.status_robot["status"],
        "product": control.status_robot["product"]
    })

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("Encerrado")