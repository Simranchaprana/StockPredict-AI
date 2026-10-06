from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from src.models.base import BaseModel

class LogisticRegressionWrapper(BaseModel):
    def __init__(self, **kwargs):
        self.model = make_pipeline(StandardScaler(), LogisticRegression(**kwargs))
        
    def fit(self, X, y):
        self.model.fit(X, y)
        
    def predict(self, X):
        return self.model.predict(X)
        
    def predict_proba(self, X):
        return self.model.predict_proba(X)
