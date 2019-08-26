## Get tree list workbook => chapters => pages
Return tree list workbook => chapters => pages

> Example Request

```shell
curl -X GET \
  'http://localhost:8080/api/workbooks/{workbook_id}?access_token={access_token}&filter={"include": {"chapters": "pages"}}'
```

> Example Response

```json
{
    "id": 3,
    "type": "workbook",
    "attributes":
    {
        "title": "Entrepreneurship Fundamentals: Business Startup Strategies",
        "description": "Amet ipsam voluptas repudiandae est et eius. Minima quod neque. Quasi ut delectus voluptas culpa perspiciatis. Excepturi quo error voluptatum deserunt mollitia cum.",
        "price": 75,
        "image_url": "http://localhost:8080/upload/jenny-hill-205881-unsplash.jpg",
        "is_active": true
    },
    "included": [
    {
        "id": 2,
        "type": "chapters",
        "attributes":
        {
            "title": "Team Formation and Organization",
            "createdAt": "2019-02-19T03:03:05.000Z",
            "updatedAt": "2019-02-19T03:03:05.000Z",
            "is_active": true,
            "pages": [
            {
                "title": "Lean Culture Principles & Practices",
                "id": 15,
                "createdAt": "2019-02-19T03:03:07.000Z",
                "updatedAt": "2019-02-19T03:03:07.000Z",
                "is_active": true
            },
            {
                "title": "Why Lean Culture and Leadership",
                "id": 24,
                "createdAt": "2019-02-19T03:03:07.000Z",
                "updatedAt": "2019-02-19T03:03:07.000Z",
                "is_active": true
            }]
        }
    }]
}
```

### HTTP Request
**GET** `http://localhost:8080/api/workbooks/{workbook_id}?access_token={access_token}&filter={"include": {"chapters": "pages"}}`

### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|workbook_id | number | Required | | The ID of the workbook will retrieve list of chapters belongs to. |
|filter | string | Optional | `{"include": {"chapters": "pages"}}` |Include chapters/pages of the workbook as tree list in response value.|


### Response
If successful, return an object contains tree list workbook => chapters => pages.


