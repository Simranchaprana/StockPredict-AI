from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import numpy as np

class SentimentScorer:
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()
        
    def score_text(self, text: str) -> float:
        """
        Scores a single string of text.
        Returns a compound score from -1.0 (extremely negative) to 1.0 (extremely positive).
        """
        if not text or not isinstance(text, str):
            return 0.0
        return self.analyzer.polarity_scores(text)['compound']
        
    def aggregate_daily_sentiment(self, texts: list[str]) -> float:
        """
        Aggregates multiple news headlines/summaries into a single daily score.
        If no texts are provided, returns exactly 0.0 (explicit no-news fallback).
        """
        if not texts:
            return 0.0
            
        scores = [self.score_text(t) for t in texts]
        # Use mean for aggregation. Could also use weighted mean if time/relevance was provided.
        return float(np.mean(scores))
