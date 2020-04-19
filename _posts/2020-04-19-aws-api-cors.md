---
layout: post
title: AWS API Gateway CORS issues
tags:
  - aws
  - api
  - api gateway
  - cors
---
After my [last blog post](/aws-api-dynamodb) we can start to make requests via axios to my API gateway. Hitting the gateway directly via postman or the browser worked fine, but with axios we were running into CORS issues. This is a super short blog detailing what we need to do to deal with these CORS issues. I'm not going to get into a big description about CORS because there's a whole bunch of stuff about OPTIONS requests, origin headers and other boring stuff you can read elsewhere. We just want to know what to do to start making those axios requests right?

A request can either be simple, or not simple, simple right? If a request is non-simple, you need to enable CORS.  
A request is simple if all of these are true:
 - The API you're accessing only allows GET, HEAD, and POST requests.
 - If it is a POST request, it must include an Origin header.
 - Content-type can only be text/plain, multipart/form-data, or application/x-www-form-urlencoded.
 - No contain custom headers.
[See the AWS documention](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)  
Most API requests are going to be non-simple because we're going to be making requests for application/json content, so we need to enable CORS.

There are 3 settings for this, all starting with `Access-Control-Allow-`, `Headers`, `Methods` and `Origin`. For developement we can just set all these to `*` and get on with poking some code around.  
These go where we put the apigateway integration:
```
x-amazon-apigateway-integration:
  credentials: !GetAtt [ApiGatewayRole, Arn]
  uri:
    'Fn::Sub': 'arn:aws:apigateway:${AWS::Region}:dynamodb:action/Scan'
  responses:
    default:
      statusCode: '200'
      responseParameters:
        method.response.header.Access-Control-Allow-Headers: "'*'"
        method.response.header.Access-Control-Allow-Methods: "'*'"
        method.response.header.Access-Control-Allow-Origin: "'*'"
```
This will allow us to get up and running straight away, now to be more strict we want to specify what headers, methods and origins we're allowing, what this actually does *I think* is set the response headers from the OPTIONS request which tells the client what it can do on this API. So at a minimum I think this should get us up and running, we want to allow the content-type header, we want to allow options and get requests, and for now the traffic will come from our local dev

```
        method.response.header.Access-Control-Allow-Headers: "'Content-Type'"
        method.response.header.Access-Control-Allow-Methods: "'OPTIONS,GET'"
        method.response.header.Access-Control-Allow-Origin: "'http://localhost:3000'"
```

Here's an updated [cloudformation-template.yml](/assets/aws-api-cors-template.yaml)

And that should be it! Enjoy!