# Local Environment Setup Guide for SparkApply

## 1. Introduction

This guide provides detailed instructions for setting up your local development and deployment environment for the SparkApply application. It covers the installation of essential tools like Docker Desktop and Kubernetes (either via Docker Desktop or Minikube), preparing your system for a smooth deployment of SparkApply.

## 2. Prerequisites

*   **Operating System:** Windows 10/11, macOS, or Linux.
*   **Administrator/sudo privileges:** Required for installing tools.
*   **Internet Connection:** Required for downloading necessary components.

## 3. Docker Desktop Installation

Docker Desktop is an application for macOS, Windows, and Linux that makes it easy to build and share containerized applications and microservices. It includes Docker Engine, Docker CLI client, Docker Compose, Kubernetes, and Credential Helper.

### 3.1. Download Docker Desktop

1.  **For Windows:** Go to [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
2.  **For macOS:** Go to [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
3.  **For Linux:** Go to [Docker Desktop for Linux](https://docs.docker.com/desktop/install/linux-install/)

### 3.2. Install Docker Desktop

1.  Follow the instructions on the Docker documentation page for your operating system.
2.  Typically, this involves downloading the installer, running it, and following the on-screen prompts.
3.  After installation, start Docker Desktop. It might require a system restart.

### 3.3. Verify Docker Installation

Open a new terminal (Command Prompt or PowerShell on Windows, Terminal on macOS/Linux) and run:

```bash
docker --version
docker compose version
```

**Expected Result:** You should see the installed versions of Docker and Docker Compose.

## 4. Kubernetes Setup

SparkApply is designed to run on Kubernetes. You have two primary options for setting up a local Kubernetes cluster:

### Option A: Kubernetes via Docker Desktop (Recommended for simplicity)

Docker Desktop includes a standalone Kubernetes server. This is the easiest way to get a local Kubernetes cluster running if Docker Desktop is functioning correctly.

1.  **Enable Kubernetes in Docker Desktop:**
    *   Open Docker Desktop.
    *   Go to **Settings** (gear icon).
    *   Navigate to **Kubernetes** in the left sidebar.
    *   Check the box **"Enable Kubernetes"**.
    *   Click **"Apply & Restart"**.
    *   Wait for Kubernetes to start. This might take a few minutes. The Docker Desktop icon in your system tray will show a green light when Kubernetes is running.

2.  **Verify Kubernetes Installation:**
    Open a new terminal and run:

    ```bash
    kubectl version --client
    kubectl cluster-info
    kubectl get nodes
    ```

    **Expected Result:**
    *   `kubectl version --client` should show the client version.
    *   `kubectl cluster-info` should show that Kubernetes control plane is running.
    *   `kubectl get nodes` should list a node named `docker-desktop` (or similar), with status `Ready`.

    If you encounter issues (e.g., "Unable to connect to the server"), ensure Docker Desktop is fully started and Kubernetes is enabled.

### Option B: Minikube Installation (Alternative if Docker Desktop Kubernetes fails)

If Docker Desktop's built-in Kubernetes is not working for you, Minikube is an excellent alternative for running a local Kubernetes cluster. I have provided automated scripts for Windows to simplify this process.

1.  **Clone the SparkApply Repository:**

    If you haven't already, clone the SparkApply repository to your local machine:

    ```bash
    git clone https://github.com/frostlab63/sparkapply.git
    cd sparkapply
    ```

2.  **Navigate to Scripts Directory:**

    Change your directory to where the installation scripts are located:

    ```bash
    cd scripts/deployment
    ```

3.  **Run Minikube Installation Script (Windows Only):**

    *   **Right-click on `install-minikube.bat`**.
    *   Select **"Run as administrator"**.

    This script will:
    *   Download and install `kubectl` and `Minikube`.
    *   Add them to your system PATH.
    *   Start a Minikube cluster using the Docker driver.
    *   Enable the Kubernetes Dashboard and Ingress addons.

    **Expected Result:** A PowerShell window will display the installation progress. After several minutes, it should report "🎉 SUCCESS! Minikube is now installed and running!" and `kubectl get nodes` should list a `minikube` node.

4.  **Verify Minikube Installation:**
    Open a **NEW** terminal (Command Prompt or PowerShell) and run:

    ```bash
    kubectl version --client
    kubectl cluster-info
    kubectl    get nodes
    minikube status
    ```

    **Expected Result:** All commands should report a healthy Minikube cluster.

## 5. Next Steps

Once Docker Desktop and Kubernetes (either via Option A or B) are successfully installed and verified, you are ready to proceed with deploying the SparkApply application. Refer to the `COMPREHENSIVE_DEPLOYMENT_GUIDE.md` in the `docs/` directory of your cloned SparkApply repository for the next steps on deploying the application to your local Kubernetes cluster. This will involve running the `deploy-sparkapply.ps1` script.
