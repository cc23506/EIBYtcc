from flask import Flask, request, jsonify
import control  # Importar o arquivo de controle do robô
import threading

app = Flask(__name__)

# Função para rodar o controle do robô em segundo plano
def run_robot(product):
    control.detectar_objeto(product)

@app.route('/api/control-robot', methods=['POST'])
def control_robot():
    data = request.json
    product = data.get('product')
    requester = data.get('requester')

    if product:
        # Inicia a detecção e o movimento do robô em uma nova thread
        robot_thread = threading.Thread(target=run_robot, args=(product,))
        robot_thread.start()
        return jsonify({"success": True, "message": f"Bucando: {product}\n\n Pedido por: {requester}"})
    
    return jsonify({"success": False, "message": "Produto não encontrado."})

@app.route('/api/stop-robot', methods=['POST'])
def stop_robot():
    # Função para parar o robô
    control.parar_robot()
    return jsonify({"success": True, "message": "Robô parado."})

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