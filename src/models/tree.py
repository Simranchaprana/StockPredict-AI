from sklearn.ensemble import RandomForestClassifier
from src.models.base import BaseModel

class RandomForestWrapper(BaseModel):
    def __init__(self, **kwargs):
        self.model = RandomForestClassifier(**kwargs)
        
    def fit(self, X, y):
        self.model.fit(X, y)
        
    def predict(self, X):
        return self.model.predict(X)
        
    def predict_proba(self, X):
        return self.model.predict_proba(X)
