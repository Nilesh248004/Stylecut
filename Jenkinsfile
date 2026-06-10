pipeline {
    agent any

    environment {
        PATH = "/opt/homebrew/bin:/usr/local/bin:${PATH}"
        NODE_ENV = "production"
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Cloning Stylecut repository...'
                checkout scm
            }
        }

        stage('Check Tools') {
            steps {
                echo 'Checking Node and npm versions...'
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install Root Dependencies') {
            steps {
                echo 'Installing root dependencies...'
                sh 'npm install'
            }
        }

        stage('Install Server Dependencies') {
            steps {
                echo 'Installing backend server dependencies...'
                dir('server') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Client Frontend Dependencies') {
            steps {
                echo 'Installing client frontend dependencies...'
                dir('client-frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Barber Frontend Dependencies') {
            steps {
                echo 'Installing barber frontend dependencies...'
                dir('barber-frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Build Client Frontend') {
            steps {
                echo 'Building client frontend...'
                dir('client-frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Build Barber Frontend') {
            steps {
                echo 'Building barber frontend...'
                dir('barber-frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Verify Server Start File') {
            steps {
                echo 'Checking backend server entry file...'
                dir('server') {
                    sh 'test -f src/index.js'
                }
            }
        }

        stage('Test Server') {
            steps {
                echo 'Running backend tests if available...'
                dir('server') {
                    sh '''
                        if npm run | grep -q "test"; then
                            npm test
                        else
                            echo "No server test script found, skipping..."
                        fi
                    '''
                }
            }
        }

        stage('Test Client Frontend') {
            steps {
                echo 'Running client frontend tests if available...'
                dir('client-frontend') {
                    sh '''
                        if npm run | grep -q "test"; then
                            npm test
                        else
                            echo "No client frontend test script found, skipping..."
                        fi
                    '''
                }
            }
        }

        stage('Test Barber Frontend') {
            steps {
                echo 'Running barber frontend tests if available...'
                dir('barber-frontend') {
                    sh '''
                        if npm run | grep -q "test"; then
                            npm test
                        else
                            echo "No barber frontend test script found, skipping..."
                        fi
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'STYLECUT BUILD SUCCESSFUL!'
        }

        failure {
            echo 'STYLECUT BUILD FAILED - Check Jenkins console logs.'
        }

        always {
            echo 'Pipeline execution completed.'
        }
    }
}
