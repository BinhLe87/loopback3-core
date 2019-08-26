## Add a chapter into a workbook
Add a chapter into a workbook

> Example Request

```shell
curl -X POST \
  'http://localhost:8080/api/workbooks/1/chapters?access_token=a628MYIXe9A697xFAcGEg9C9wfWE8Cg0XYzrF8JSrtUwVGhcHQ1peO82MrAPUziH' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'title=workbook_title&insert_after_item_id=39'
```

> Example Response

```json
```

### HTTP Request
**POST** `http://localhost:8080/api/workbooks/{workbook_id}/chapters?access_token={access_token}`

### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|workbook_id | number | Required | | The ID of the workbook which the new chapter add into |


### Request body

| Parameter       | Data type | Required? | Default | Description |                                                     
| --------------- | --------- | --------- | ------- | ----------- |
| title            | string    | optional  |         | chapter title |
| insert_after_item_id | number    | optional  |         | If value is `0`, the new chapter will move to the top position in the workbook. If value is `null` or unspecified, the new chapter will move to the last position in the workbook. Otherwise, if value is specified, the new chapter will move to right below the `insert_after_item_id` chapter.


### Response
If successful, return a new chapter object


