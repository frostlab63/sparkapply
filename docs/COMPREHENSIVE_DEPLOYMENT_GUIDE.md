# Comprehensive SparkApply Deployment Guide

## 1. Introduction

This guide provides a comprehensive walkthrough for deploying the SparkApply application to a Kubernetes cluster. It covers everything from setting up the local environment to deploying the application and verifying its status. This document is intended for developers and DevOps engineers responsible for deploying and managing the SparkApply platform.

## 2. Prerequisites

Before you begin, ensure your system meets the following requirements:

*   **Operating System:** Windows 10/11, macOS, or Linux.
*   **Git:** Installed and configured.
*   **Docker Desktop:** Installed and running. This is used for local containerization and as a driver for Minikube.
*   **kubectl:** The Kubernetes command-line tool. This will be installed by the Minikube installation script if it is not already present.
*   **Minikube:** For local Kubernetes cluster setup. This will be installed by the provided scripts.
*   **Administrator/sudo privileges:** Required for installing tools and running scripts.

## 3. Local Environment Setup

To prepare your local machine for deployment, you will need to set up a Kubernetes cluster using Minikube. The provided scripts will automate this process.

### 3.1. Clone the Repository

First, clone the SparkApply repository to your local machine:

```bash
git clone https://github.com/frostlab63/sparkapply.git
cd sparkapply
```

### 3.2. Run the Minikube Installation Script

Navigate to the `scripts/deployment` directory and run the Minikube installation script. This will install `kubectl` and `Minikube`, and then start your local Kubernetes cluster.

**For Windows:**

1.  Open PowerShell as Administrator.
2.  Navigate to the `scripts/deployment` directory.
3.  Run the `install-minikube.bat` script:

    ```powershell
    .\install-minikube.bat
    ```

**For macOS/Linux:**

*A dedicated script for macOS/Linux can be provided upon request. The general steps would involve using a package manager like Homebrew or downloading the binaries directly.*

After the script completes, you will have a running Minikube cluster.

## 4. Application Deployment

Once your local Kubernetes cluster is running, you can deploy the SparkApply application using the provided deployment script.

### 4.1. Run the Deployment Script

**For Windows:**

1.  Open PowerShell as Administrator.
2.  Navigate to the `scripts/deployment` directory.
3.  Run the `deploy-sparkapply.ps1` script:

    ```powershell
    .\deploy-sparkapply.ps1
    ```

This script will:

*   Create the `sparkapply-prod` namespace.
*   Apply all Kubernetes manifests from the `k8s/production/` directory, including deployments, services, secrets, ConfigMaps, and network policies.
*   Wait for all deployments to become ready.

### 4.2. Verify the Deployment

After the deployment script finishes, you can verify that all components are running correctly:

```bash
# Check the status of all pods in the sparkapply-prod namespace
kubectl get pods -n sparkapply-prod

# Check the status of all services
kubectl get services -n sparkapply-prod

# Check the status of the ingress
kubectl get ingress -n sparkapply-prod
```

You should see all pods in the `Running` state and all services and ingress created.

## 5. Accessing the Application

To access the SparkApply application, you can use the Minikube service command, which will automatically open the application in your default web browser:

```bash
minikube service web -n sparkapply-prod
```

Alternatively, you can get the Minikube IP and access it directly:

```bash
minikube ip
```

Then, open your browser and navigate to `http://<MINIKUBE_IP>`.

## 6. Monitoring and Security

### 6.1. Prometheus Monitoring

The deployment includes Prometheus for monitoring. You can access the Prometheus dashboard to view metrics about your application and the Kubernetes cluster:

```bash
minikube service prometheus-service -n sparkapply-prod
```

### 6.2. Network Policies

Network policies have been configured to restrict traffic between pods, enhancing security. The default policy is to deny all traffic, with specific rules to allow necessary communication (e.g., web to API, API to database).

## 7. CI/CD Pipeline

The repository is configured with a full CI/CD pipeline using GitHub Actions. The pipeline will automatically:

*   Run tests and code quality checks.
*   Build and push Docker images to GitHub Container Registry (ghcr.io).
*   Deploy to the production environment when a new version tag is pushed.

## 8. Conclusion

This guide has provided a comprehensive overview of the SparkApply deployment process. By following these steps, you can successfully deploy and manage the SparkApply application in a Kubernetes environment.

