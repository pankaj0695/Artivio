import os
from google.ads.googleads.client import GoogleAdsClient

def _load_google_ads_client():
    return GoogleAdsClient.load_from_dict({
        "developer_token": os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN"),
        "client_id": os.getenv("GOOGLE_ADS_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_ADS_CLIENT_SECRET"),
        "refresh_token": os.getenv("GOOGLE_ADS_REFRESH_TOKEN"),
        "login_customer_id": os.getenv("GOOGLE_ADS_LOGIN_CUSTOMER_ID").replace("-", ""),
        "use_proto_plus": True,
    })

client = _load_google_ads_client()
ga = client.get_service("GoogleAdsService")
query = "SELECT customer.id, customer.descriptive_name, customer.manager, customer.test_account FROM customer LIMIT 5"
for row in ga.search(customer_id=os.getenv("GOOGLE_ADS_TEST_CUSTOMER_ID").replace("-", ""), query=query):
    print(row.customer.id, row.customer.descriptive_name, "manager?", row.customer.manager, "test?", row.customer.test_account)