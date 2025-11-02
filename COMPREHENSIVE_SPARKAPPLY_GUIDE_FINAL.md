# Comprehensive SparkApply Local Kubernetes Deployment Guide (Copy-Paste Edition)

This guide provides the final, confirmed steps for accessing and managing your successfully deployed SparkApply application on Minikube. All commands and necessary text are provided in easily copy-and-pasteable blocks.

## 1. Final Deployment Status

The Minikube cluster is running, and the SparkApply application has been successfully deployed.

| Component | Status | IP Address | Hostname |
| :--- | :--- | :--- | :--- |
| **Minikube IP** | Running | `192.168.49.2` | N/A |
| **Application Access** | Ready | N/A | `sparkapply.local` |
| **Microservices** | All Running | N/A | N/A |

## 2. Accessing the SparkApply Application

To access the application, you must update your Windows hosts file to map the application's domain name (`sparkapply.local`) to the Minikube IP address (`192.168.49.2`).

### 2.1 Step-by-Step Hosts File Configuration

The hosts file is located at `C:\Windows\System32\drivers\etc\hosts`. You need **Administrator privileges** to edit and save this file.

1.  **Open Notepad as Administrator**:
    *   Press `Windows Key` + `R` to open the Run dialog.
    *   Type `notepad` and press `Ctrl` + `Shift` + `Enter`. (Click **Yes** on the UAC prompt).

2.  **Open the Hosts File**:
    *   In the Administrator Notepad, click **File** > **Open...**.
    *   Navigate to: `C:\Windows\System32\drivers\etc\`
    *   Change the file type dropdown to **All Files (\*.\*)**.
    *   Select the **hosts** file and click **Open**.

3.  **Copy and Paste the Mapping Line**:
    *   Scroll to the very bottom of the file.
    *   **Copy the line below and paste it as a new line at the end of your hosts file:**

    ```
    192.168.49.2 sparkapply.local
    ```

4.  **Save and Close**:
    *   Click **File** > **Save**.
    *   Close the Notepad window.

### 2.2 Access the Application

1.  Open your web browser.
2.  **Copy and paste the URL below** into the address bar:

    ```
    http://sparkapply.local/
    ```

You should now see the SparkApply application.

## 3. Post-Deployment Management and Testing

Here are the essential commands for managing your Minikube cluster and testing the deployment.

### 3.1 Minikube Management Commands

| Action | Command (Copy-Paste) | Description |
| :--- | :--- | :--- |
| **Start Minikube** | `minikube start` | Starts the cluster (use this if you stop it). |
| **Stop Minikube** | `minikube stop` | Stops the cluster without deleting its data. |
| **Delete Minikube** | `minikube delete` | Completely deletes the cluster and all resources. |
| **Get Current IP** | `minikube ip` | Retrieves the current Minikube IP (needed if it changes). |
| **Open Dashboard** | `minikube dashboard` | Opens the Kubernetes dashboard in your browser. |

### 3.2 Kubernetes Monitoring Commands

The namespace for the SparkApply application is `sparkapply-prod`.

| Action | Command (Copy-Paste) | Description |
| :--- | :--- | :--- |
| **List All Pods** | `kubectl get pods -n sparkapply-prod` | Shows the status of all application containers. |
| **List Deployments** | `kubectl get deployments -n sparkapply-prod` | Shows the status of all application deployments. |
| **View Pod Logs** | `kubectl logs -f <pod-name> -n sparkapply-prod` | Streams the logs for a specific pod (e.g., `user-service-XXXXX-XXXXX`). |

## 4. Database Migration Process (For Future Updates)

The migration process is handled by your application's code, but here are the two primary Kubernetes patterns for executing them safely:

| Pattern | Description | When to Use |
| :--- | :--- | :--- |
| **Init Containers** | A container that runs a migration script to completion *before* the main application container starts. | Ideal for ensuring the database is ready on every deployment. |
| **Kubernetes Jobs** | A dedicated, one-off resource that runs a migration script to completion. | Ideal for complex, manual, or one-time database setup/seeding tasks. |

## 5. Key Technologies for Future Development

| Category | Technology/Practice | Purpose |
| :--- | :--- | :--- |
| **Backend** | Node.js, PostgreSQL, Redis | Core microservice, persistent storage, and caching. |
| **Frontend** | React (or similar) | Interactive and responsive user interface. |
| **Deployment** | CI/CD, Infrastructure as Code (IaC) | Automated, reliable delivery and version-controlled infrastructure. |
| **Observability**| Prometheus & Grafana, Centralized Logging | Monitoring, metrics, and log aggregation. |

