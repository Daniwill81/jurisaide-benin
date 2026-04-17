FROM python:3.12

# Set the current working directory to /code.
WORKDIR /app

RUN pip install --upgrade pip setuptools wheel

# Copy the file with the requirements to the /code directory.
COPY ./requirements.txt /code/requirements.txt

# Install the package dependencies in the requirements file.
# The --no-cache-dir option tells pip to not save the downloaded packages locally.
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Important : force setuptools (bring pkg_resources)
RUN pip install --no-cache-dir setuptools

# Copy the project directory inside the /app directory.
COPY . /app

# Run migrations scripts before starting the app
# RUN bash /app/scripts/build.sh

# Mpake the port 10000 of the containier
EXPOSE 10000

# Run the run.sh script
# CMD ["bash", "scripts/uvicorn.sh"]
CMD ["bash", "scripts/run.sh"]
