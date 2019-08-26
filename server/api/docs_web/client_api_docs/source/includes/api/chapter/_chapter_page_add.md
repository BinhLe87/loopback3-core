## Add a page into a chapter
Add a page into a chapter

> Example Request

```shell
curl -X POST \
  'http://localhost:8080/api/chapters/1/pages?access_token=a628MYIXe9A697xFAcGEg9C9wfWE8Cg0XYzrF8JSrtUwVGhcHQ1peO82MrAPUziH' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'title=page_title&insert_after_item_id=39'
```

> Example Response

```json
```

### HTTP Request
**POST** `http://localhost:8080/api/chapters/{chapter_id}/pages?access_token={access_token}`

### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|chapter_id | number | Required | | The ID of the chapter which the new page add into |


### Request body

| Parameter       | Data type | Required? | Default | Description |                                                     
| --------------- | --------- | --------- | ------- | ----------- |
| title            | string    | optional  |         | page title |
| insert_after_item_id | number    | optional  |         | If value is `0`, the new page will move to the top position in the chapter. If value is `null` or unspecified, the new page will move to the last position in the chapter. Otherwise, if value is specified, the new page will move to right below the `insert_after_item_id` page.


### Response
If successful, return a new page object


