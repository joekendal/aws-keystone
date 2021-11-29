# AWS Keystone

AWS Keystone is a community-maintained template for deploying [KeystoneJS](https://keystonejs.com/) on AWS using serverless constructs.

## Features
**Auto-Scaling**: save on costs and scale up to meet demand (Fargate and Aurora) ✅

## TODO
- [ ] **CI/CD Pipeline**: commit your changes to the schema and push to upstream repo for re-deployment
- [ ] **S3 & CloudFront**: make your file uploads available over CDN
- [ ] **DNS & TLS**: use Route53 and ACM to make it highly available and secure

## Basic Usage

1. Clone the repository / use Template
2. Make changes in `src/keystone`
3. Deploy using `cdk deploy`
