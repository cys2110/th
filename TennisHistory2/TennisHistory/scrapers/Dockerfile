FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m playwright install --with-deps chromium
RUN apt-get update \
    && apt-get install -y --no-install-recommends fluxbox novnc websockify x11vnc \
    && rm -rf /var/lib/apt/lists/*

COPY . .

ENV DISPLAY=:99
ENV PLAYWRIGHT_HEADLESS=false
ENV FLASK_APP=main.py

EXPOSE 5001 6080

CMD ["./start-visible.sh"]
