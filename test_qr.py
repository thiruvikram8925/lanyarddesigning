import cv2
import sys

img_path = "/Users/shailendhirah/.gemini/antigravity-ide/brain/097e9d75-bd20-4bab-9958-14a90e99a563/media__1781089548742.png"
img = cv2.imread(img_path)
detector = cv2.QRCodeDetector()
data, bbox, _ = detector.detectAndDecode(img)
if data:
    print("QR Code Data Found:")
    print(repr(data))
else:
    print("No QR Code found or could not decode.")
