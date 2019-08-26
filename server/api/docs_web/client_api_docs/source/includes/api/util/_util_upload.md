## Upload file(s)
Upload file(s). 

**Notice that**: In order to upload an image that associates with specific object like an item/a workbook/etc., please read API guidelines in corresponding object section.

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
            "file_url": "http://dev01.cc.cloud:49173/upload/api/2019/05/06/rawpixel-670711-unsplash_s01_api_20190506_0a716d.jpg",
            "file_size_medium_url": "http://dev01.cc.cloud:49173/upload/api/2019/05/06/rawpixel-670711-unsplash_s01_api_20190506_0a716d_900_600.jpg",
            "file_size_low_url": "http://dev01.cc.cloud:49173/upload/api/2019/05/06/rawpixel-670711-unsplash_s01_api_20190506_0a716d_562_375.jpg"
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
| data | array | An array of objects, each object contains `file_url` property is the url of an uploaded file. In addition, if uploaded file is `image` type, it will contains resized images with different resolutions for desktop device and mobile device in `file_size_medium_url` field and `file_size_low_url` field correspondingly.


<aside class="notice">
You must provide both query parameters and a file as multipart form data. For reference, you can see Postman screenshot below.
</aside>
![upload api capture postman](http://dev01.cc.cloud:49173/public/assets/images/upload_api_postman.jpg)