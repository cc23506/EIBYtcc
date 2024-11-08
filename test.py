import cv2
import numpy as np

# Carregar a imagem da planta
image = cv2.imread('./public/uploads/1731021211756-478633059.jpg')

# Convertendo para escala de cinza
gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Aplicando um limiar para detectar as zonas (você pode ajustar o valor de 200 conforme necessário)
_, thresholded_image = cv2.threshold(gray_image, 200, 255, cv2.THRESH_BINARY)

# Encontrando contornos que podem representar as zonas
contours, _ = cv2.findContours(thresholded_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Desenhando os contornos encontrados na imagem
for contour in contours:
    cv2.drawContours(image, [contour], -1, (0, 255, 0), 2)

# Exibir a imagem resultante
cv2.imshow('Zonas Detectadas', image)
cv2.waitKey(0)
cv2.destroyAllWindows()
