FROM python:3.13-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PAR_STATE_DIR=/var/lib/aegi-par \
    PAR_CASE_TTL_HOURS=24 \
    PAR_PUBLIC_TRIAL=1 \
    PAR_PUBLIC_HTTPS=1
RUN useradd --uid 10001 --create-home --shell /usr/sbin/nologin par \
    && mkdir -p /var/lib/aegi-par \
    && chown -R par:par /var/lib/aegi-par
COPY AEGI_PAR_P3_APP_BUNDLE.zip /tmp/aegi.zip
RUN python -m zipfile -e /tmp/aegi.zip /app \
    && sed -i 's/opencv-python-headless==4.13.0$/opencv-python-headless==4.13.0.92/' /app/requirements-prod.txt \
    && pip install --no-cache-dir -r /app/requirements-prod.txt \
    && rm -f /tmp/aegi.zip \
    && chown -R par:par /app
USER 10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD python -c "import urllib.request,os; urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('PORT','8000')+'/api/v1/readyz', timeout=2).read()" || exit 1
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips=${PAR_FORWARDED_ALLOW_IPS:-*} --no-server-header --no-access-log"]
