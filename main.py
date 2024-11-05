import requests
# this is just to test my idea 
url = "https://www.sih.gov.in/screeningresult"
headers = {
    "FIND AND PUT "
}

cookies = {
    "FIND AND PUT"
}

try:
    response = requests.get(url, headers=headers, cookies=cookies, verify=False)  # disable SSL verification if needed
    # print("Response Status Code:", response.status_code)
    # print("Response Text:", response.text)
    print("SIH code: ")
    a = input()
    if a in response.text:
        print("Your problem statement is updated")
    else:
        print("Nope your problem statement did not come yet")
except requests.exceptions.RequestException as e:
    print("An error occurred:", e)
