# mock_gpio.py - Simulação do comportamento do RPi.GPIO para testes

class MockGPIO:
    BCM = "BCM"
    OUT = "OUT"
    IN = "IN"
    HIGH = 1
    LOW = 0

    def __init__(self):
        self.pins = {}

    def setmode(self, mode):
        print(f"GPIO mode set to {mode}")

    def setup(self, pin, mode):
        self.pins[pin] = mode
        print(f"Pin {pin} set to {mode}")

    def output(self, pin, state):
        print(f"Pin {pin} set to {'HIGH' if state == self.HIGH else 'LOW'}")

    def input(self, pin):
        print(f"Reading input from pin {pin}")
        return self.LOW  # Simula como se o sensor não estivesse detectando nada

    def PWM(self, pin, freq):
        print(f"Started PWM on pin {pin} with frequency {freq}")
        return MockPWM(pin)

    def cleanup(self):
        print("Cleaning up GPIO")

class MockPWM:
    def __init__(self, pin):
        self.pin = pin

    def start(self, duty_cycle):
        print(f"Started PWM on pin {self.pin} with duty cycle {duty_cycle}")

    def ChangeDutyCycle(self, duty_cycle):
        print(f"Changed duty cycle to {duty_cycle} on pin {self.pin}")

    def stop(self):
        print(f"Stopped PWM on pin {self.pin}")

# Instância única para ser importada
GPIO = MockGPIO()