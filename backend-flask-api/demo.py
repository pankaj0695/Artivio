from google.ads.googleads.client import GoogleAdsClient
import os

client = GoogleAdsClient.load_from_dict({
    "developer_token": os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN"),
    "client_id": os.getenv("GOOGLE_ADS_CLIENT_ID"),
    "client_secret": os.getenv("GOOGLE_ADS_CLIENT_SECRET"),
    "refresh_token": os.getenv("GOOGLE_ADS_REFRESH_TOKEN"),
    "login_customer_id": os.getenv("GOOGLE_ADS_LOGIN_CUSTOMER_ID").replace("-", ""),  # MCC
    "use_proto_plus": True,
})

customer_service = client.get_service("CustomerService")
customer = client.get_type("Customer")
customer.descriptive_name = "Artivio Test Client Account"
customer.currency_code = "INR"
customer.time_zone = "Asia/Kolkata"

response = customer_service.create_customer_client(
    customer_id=os.getenv("GOOGLE_ADS_LOGIN_CUSTOMER_ID").replace("-", ""),
    customer_client=customer
)
print("Created client:", response.resource_name)
