## Move position of a page within a chapter
Move position of a page within a chapter

> Example Request

```shell
curl -X PATCH \
  'http://localhost:8080/api/chapters/9/pages/15/move/29?access_token=sqlrd4F3Q9Xi5vXmS0dtRvFobcVaRTNGug2AGHauhlSo3hTbvHTbCtHFPDs7ZMqV'
```

> Example Response

```json
HTTP Response Status code: 200
```

### HTTP Request
**PATCH** `http://localhost:8080/api/chapters/{chapter_id}/pages/{from_page_id}/move/{to_page_id}?access_token={access_token}`


### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|chapter_id | number | Required | | chapter identifier contains page will move position|
|from_page_id | number | Required | | page identifier that moves from (called as `from_page`)|
|to_page_id | number | Optional | | page identifier that moves to (called as `to_page`). If value is `0`, the `from_page` will move to the top position in chapter. If value is `null` or unspecified, the `from_page` will move to the last position in chapter. Otherwise, if value is specified `to_page` identifier, the `from_page` will move to right below `to_page` and also move series of pages down the list starting from the pages was currently below `to_page`.|


### Response
If successful, return http response status code 200.


<aside class="notice">
In order to swap positions between two pages, you can use API instead:<br>
<code>curl -X PATCH
  'http://localhost:8080/api/chapters/{chapter_id}/pages/{from_page_id}/swap/{to_page_id}?access_token={access_token}'</code>
</aside>