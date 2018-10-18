## Move position of a chapter within a workbook
Move position of a chapter within a workbook

> Example Request

```shell
curl -X PATCH \
  'http://localhost:8080/api/workbooks/9/chapters/15/move/29?access_token=sqlrd4F3Q9Xi5vXmS0dtRvFobcVaRTNGug2AGHauhlSo3hTbvHTbCtHFPDs7ZMqV'
```

> Example Response

```json
HTTP Response Status code: 200
```

### HTTP Request
**PATCH** `http://localhost:8080/api/workbooks/{workbook_id}/chapters/{from_chapter_id}/move/{to_chapter_id}?access_token={access_token}`


### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|workbook_id | number | Required | | workbook identifier contains chapter will move position|
|from_chapter_id | number | Required | | chapter identifier that moves from (called as `from_chapter`)|
|to_chapter_id | number | Optional | | chapter identifier that moves to (called as `to_chapter`). If unspecified, the `from_chapter` will move to the last position in workbook, otherwise it will move the `from_chapter` to exact position of `to_chapter` and also move series of chapters down the list starting from the `to_chapter` that was at to_position.|


### Response
If successful, return http response status code 200.


<aside class="notice">
In order to swap positions between two chapters, you can use API instead:<br>
<code>curl -X PATCH
  'http://localhost:8080/api/workbooks/{workbook_id}/chapters/{from_chapter_id}/swap/{to_chapter_id}?access_token={access_token}'</code>
</aside>