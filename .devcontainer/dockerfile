FROM python:3.9

RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    nano \
    git \
    zip \
    systemctl \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    apt-get install -y unzip && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf aws awscliv2.zip

# Install Python packages
RUN pip install --no-cache-dir \
    pandas \
    numpy \
    jupyter \
    notebook \
    duckdb \
    boto3 \
    openpyxl 

# Install React and other JS dependencies globally
RUN npm install -g create-react-app

ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupadd -g $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && apt-get update && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

USER $USERNAME

WORKDIR /workspaces

EXPOSE 8000
