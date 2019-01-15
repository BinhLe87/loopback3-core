## Upload file(s)
Upload file(s). 

**Notice that**: In order to upload an image that associates with any object like an item/a workbook/etc., please read API guidelines in corresponding object section.

> Example Request

```shell
curl -X POST \
  'http://localhost:8080/api/util/upload?access_token=sqlrd4F3Q9Xi5vXmS0dtRvFobcVaRTNGug2AGHauhlSo3hTbvHTbCtHFPDs7ZMqV' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'cache-control: no-cache' \
  -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
  -F image=@/Users/Documents/CoachingCloud/server/api/upload/rawpixel-574844-unsplash.jpg
```

> Example Response

```json
{
    "data": [
        {
            "file_url": "inspirational-home-office-workspace-tips-to-get-organized-768x384_s01_api_20190115_eaac22.jpg"
        }
    ]
}
```

### HTTP Request
**POST** `http://localhost:8080/api/util/upload?access_token={access_token}`


### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|

### Response
If successful, return http response status code 200.

| Parameter | Data type | Description |
| --------- | --------- | --------- |
| data | array | An array of objects, each object contains `file_url` property is the url of an uploaded file.


<aside class="notice">
You must provide both query parameters and a file as multipart form data. For reference, you can see Postman screenshot below.
</aside>
![upload api capture postman](http://dev01.cc.cloud:49173/public/assets/images/upload_api_postman.jpg)