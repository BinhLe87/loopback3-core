## Get an access token
- An access token enables you to complete actions on behalf and with the approval of the resource owner. Most of API call require an access token in request message.
- To get an access token, you pass your credentials in a get access token call.

> Example Request

```shell
curl -X POST \
  http://localhost:8080/api/login \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d 'email=admin@coachingcloud.com&password=admin@123'
```

> Example Response

```json
{
    "email": "admin@coachingcloud.com",
    "access_token": "PprPFhmmdyMmgPDfZ1BgOZvgTIOfGEUjyyCPktomh4ENeYMK8UYEx1v93bPhDLvQ",
    "expires_in": 180
}
```

### HTTP Request
**POST** `http://localhost:8080/api/login`


### Request body

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
| email | string | Required | | client email |
| password | string | Required | | client password |


### Response
If successful, return an object contains access token info

| Parameter | Data type | Description |
| --------- | --------- | --------- |
|access_token | string | access token issued to client |
|expires_in | integer | The number of seconds after which the token expires. Request another token when this one expires. Notice that: For convenience while developing, access token timeout might set `-1` which means infinite lifetime.



