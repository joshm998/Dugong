<h1 align="center">
    <a href="https://dugong.dev">
    <img src="./.github/assets/logo.svg">
    </a>
</h1>

<p align="center">
  <b align="center">Dugong Infra – An all-in-one infrastructure tool for VPS and homelabs.</b>
</p>

<h4 align="center">
  <a href="https://github.com/joshm998/dugong/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/joshm998/dugong/ci.yml" alt="continuous integration" style="height: 20px;">
  </a>
  <a href="https://github.com/joshm998/dugong/license">
    <img src="https://img.shields.io/github/license/joshm998/dugong" alt="license" style="height: 20px;">
  </a>
  <br>
</h4>


## Introduction

Dugong Infra is your all-in-one solution for streamlined homelab and VPS management. Easily log, monitor, and deploy your microSaaS or personal projects with this simple, self-contained tool.
## Getting Started

Getting started with Dugong Infra on Debian based systems is simple as there is a bash script that provides an interactive install process.

```shell
curl -sSL https://raw.githubusercontent.com/joshm998/dugong/main/install.sh | sudo bash
```

Please read the script here before running it locally. For other platforms see the release page for binaries that can be installed and configured.

## Local Development

If you want to work on or contribute to Dugong you can clone the project locally, to run the project you will first need to generate certificates for SSL which can be done with the following command:
```shell
openssl genrsa -out server.key 2048
openssl ecparam -genkey -name secp384r1 -out server.key
openssl req -new -x509 -sha256 -key server.key -out server.crt 
```
Once these files are in the development directory you will need to set the following environment variables:
```shell
DATABASE_URL=logs.db
JWT_SECRET=<CREATE_A_SECRET>
SERVER_ADDR=8082
```
Now you can run the golang app with `go cmd/server/main.go` and then the frontend with `npm run dev` from the web directory. The frontend should be accessible on https://localhost:3001 and the go server on https://localhost:8082


## Resources

- **[Website](https://dugong.dev)** to get an detailed overview on the product.
- **[Docs](https://dugong.dev/docs)** for more detailed documentation.

## Contributing

Dugong is fully open source and licensed under the MIT license, we welcome contributions and feedback on the product. If you find any issues or a lacking feature please open a new issue with [this link](https://github.com/joshm998/dugong/issues/new), otherwise feel free to give feedback or ask questions in discussions.