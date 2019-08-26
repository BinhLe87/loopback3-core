## Search text
Search text

> Example Request

```shell
curl -X GET \
  'http://localhost:8080/api/util/search?access_token=a628MYIXe9A697xFAcGEg9C9wfWE8Cg0XYzrF8JSrtUwVGhcHQ1peO82MrAPUziH&query=proj&scope=workbook&collection=description' \
```

### HTTP Request
**GET** `http://localhost:8080/api/util/search?access_token={access_token}&query={query}&scope={scope}&collection={collection}`


### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|query | string | Required | | Search query. Should be [URL-encoded](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI)| 
|scope | string | Required | | Scope query. Must be in **one** the following values: `workbook`, `competency`| 
|collection| string | Optional | For `workbook` scope, by default, it will search in a mix of `title` and `description` | Name of collection to search. For `workbook` scope, it should be in **one** the following values: `title`, `description`, `title,description`| 

### Response
If successful, return http response status code 200.

| Parameter | Data type | Description |
| --------- | --------- | --------- |
| data | array | An array of found results.