from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    # Since we didn't define a root endpoint, we can test docs
    response = client.get("/docs")
    assert response.status_code == 200

def test_get_stock_info_invalid():
    # Test an invalid symbol
    response = client.get("/api/stock/INVALID_SYMBOL_123")
    assert response.status_code == 404

def test_history_invalid():
    response = client.get("/api/history/INVALID_SYMBOL_123?period=1y")
    assert response.status_code == 404
