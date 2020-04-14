---
layout: post
title: Using AWS to create a dynamodb driven API
tags:
  - aws
  - api
  - dynamodb
  - api gateway
---

In the previous [post](/android-viewpager2) we created an Android app that displays some json data as a swipeable ViewPager, we stubbed the data for this app at the time. This time we're going to be creating a dynamodb table driven API in AWS, cheap, simple and easy to maintain.

This is going to be a very brief run through on setting up a cloudformation stack, I'm not going to cover setting up aws or aws-cli, in another blog post I'll do this same project but with [AWS CDK](https://aws.amazon.com/cdk/).

The basic pattern is we have an API gateway, and a dynamodb table, we keep the data we want in the table and the api directly fetches the data from the table. 

### __SAM CLI__
We're using SAM CLI for transforming our cloudformation template, so we need to ensure we have a line in the cloudformation template to make the transformation
```
Transform: AWS::Serverless-2016-10-31
```

### __API Role__
We need to create a role with appropriate policies to fetch the data from the table.  
```
  ApiGatewayRole:
    Type: AWS::IAM::Role
    Properties:
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ['apigateway.amazonaws.com']
            Action: 'sts:AssumeRole'
      Path: '/'
      Policies:
        - PolicyName: DynamoApiPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 'logs:*'
                Resource: '*'
              - Effect: 'Allow'
                Action:
                  - 'dynamodb:Scan'
                  - 'dynamodb:Query'
                Resource:
                  'Fn::Sub': 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/*'
```

### __DynamoDB Table__
We create the table with an id we intend to use as a uuid, and then a secondary sorting id, and obviously we don't need to specify the structure of the table.
```
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Ref TableName
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: order_id
          AttributeType: N
      KeySchema:
        - AttributeName: id
          KeyType: HASH
        - AttributeName: order_id
          KeyType: RANGE
      ProvisionedThroughput:
        ReadCapacityUnits: '5'
        WriteCapacityUnits: '5'
```

### __API Gateway__
And then we create the API gateway to fetch the data from the table
```
  ApiGatewayApi:
    Type: AWS::Serverless::Api
    DependsOn: DynamoDBTable
    Properties:
      Name: 'ServicesGateway'
      StageName: prod
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
      DefinitionBody:
        openapi: '3.0.1'
        paths:
          /:
            get:
              responses:
                '200':
                  content:
                    application/json:
                      schema:
                        $ref: '#/components/schemas/Empty'
              x-amazon-apigateway-integration:
                credentials: !GetAtt [ApiGatewayRole, Arn]
                uri:
                  'Fn::Sub': 'arn:aws:apigateway:${AWS::Region}:dynamodb:action/Scan'
                responses:
                  default:
                    statusCode: '200'
                requestTemplates:
                  application/json:
                    { 'Fn::Sub': "{\n  \"TableName\": \"${TableName}\"\n}" }
                passthroughBehavior: 'when_no_templates'
                httpMethod: 'POST'
                type: 'aws'
```

We use the scan action on the table to fetch all the data in a single request, this will cause problems if the dataset is large but will do just fine for the small datasets we'll be using in the example. 

### __JSON Data __
There's a bit more setup but this is essentially it, we insert the data we want to use.
```
{
  "id": "12340d21-5843-4935-92a7-d4c26fff1b21",
  "order_id": 1,
  "authorText": "Pawełek Grzybek — Junior Developer",
  "companyText": "Mindera",
  "testimonialText": "Gabriel is an amazing developer and I'm so appreciative to have him as my Tech Lead, he's pretty too."
}
```

### __JSON Response & Transformation __
When we make a request to fetch this we do get the dynamodb structure back in the response
```
{
  "Count": 1,
  "Items": [
    {
      "order_id": {
        "N": "1"
      },
      "testimonialText": {
        "S": "Gabriel is an amazing developer and I'm so appreciative to have him as my Tech Lead, he's pretty too."
      },
      "id": {
        "S": "12340d21-5843-4935-92a7-d4c26fff1b21"
      },
      "companyText": {
        "S": "Mindera"
      },
      "authorText": {
        "S": "Pawełek Grzybek — Junior Developer"
      }
    }
  ],
  "ScannedCount": 1
}
```
We can either transform this in the client calling this or we can add a response mapping transformation
```
#set($inputRoot = $input.path('$'))
{
    "testimonials": [
        #foreach($elem in $inputRoot.Items) {
            "testimonialText": "$elem.testimonialText.S",
            "companyText": "$elem.companyText.S",
            "authorText": "$elem.authorText.S"
        }#if($foreach.hasNext),#end
	#end
    ]
}
```
This turns our template file from fairly generic into something very specific, but makes our client a lot cleaner.

There's some extra bits we can add in for a custom domain name, redundancy etc, otherwise we can access our api through the stand aws gateway address.

The cloudformation template for this is suprisingly simple, barely a hundred lines of yaml, a bit too much to display in-line so here's the final file [cloudformation-template.yaml](/assets/cloudformation-template.yaml)

### __Deploying Stack__
We can run it with
```
aws cloudformation deploy --template-file template.yaml --stack-name api-db-testimonals-stack --capabilities CAPABILITY_IAM --region eu-west-2 --profile gabriel403 --parameter-overrides TableName=TestimonalsTable
```

And that's it! The API for our testimonial data is all setup!