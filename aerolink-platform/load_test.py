from locust import HttpUser, task, between

class AeroLinkUser(HttpUser):
    # Wait between 1 and 3 seconds between tasks
    wait_time = between(1, 3)

    @task(3)
    def search_flights(self):
        """Simulate users frequently searching for flights."""
        # This will hit the API Gateway -> Flight Service
        self.client.get("/api/v1/flights/?limit=20")

    @task(1)
    def check_health(self):
        """Simulate infrequent health checks."""
        self.client.get("/api/v1/flights/health/live")

    def on_start(self):
        """Executed when a simulated user starts."""
        pass
