## Upload image for an workbook
Upload image for an workbook

> Example Request

```shell
curl -X POST \
  'http://localhost:8080/api/util/upload?access_token=sqlrd4F3Q9Xi5vXmS0dtRvFobcVaRTNGug2AGHauhlSo3hTbvHTbCtHFPDs7ZMqV&file_type=workbook_image&workbook_id=3' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Postman-Token: b07b3a20-c7a4-4126-b431-cfa8b4b7bb9d' \
  -H 'cache-control: no-cache' \
  -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
  -F image=@/Users/Documents/CoachingCloud/server/api/upload/rawpixel-574844-unsplash.jpg
```

> Example Response

```json
HTTP Response Status code: 200
```

### HTTP Request
**POST** `http://localhost:8080/api/util/upload?access_token={access_token}&file_type={file_type}&workbook_id={workbook_id}`


### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|file_type | string | Required | | fixed value is `workbook_image` for uploading image file of an workbook|
|workbook_id | number | Required | | workbook identifier will store uploaded image file|

### Response
If successful, return http response status code 200.


<aside class="notice">
You must provide both query parameters and a file as multipart form data. For reference, you can see Postman screenshot below.
</aside>
![upload api capture postman](http://dev01.cc.cloud:49173/public/assets/images/upload_api_postman.jpg)