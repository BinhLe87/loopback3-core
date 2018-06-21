pipeline {
    agent none
    stages {
        //This step is used to checkout and build image from Jenkins master box
        stage('buildIMG') {
            agent {label 'master'}
            steps {
                slackSend (color: '#FFFF00', message: "STARTED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
                script {
                    try {
                        //login to docker hub
                        sh 'sudo docker login -u ccjenkins -p 38YahXW4iRaHets6'
                        sh 'sleep 5'
                        //Build the image from github source code
                        sh 'COMMIT=`git rev-parse --short HEAD`;sudo docker build --no-cache -t cc/apc:dev-$BUILD_NUMBER-$COMMIT .'
                        //Push the new build IMG to dockerhub                
                        sh 'COMMIT=`git rev-parse --short HEAD`;id=`sudo docker images cc/apc:dev-$BUILD_NUMBER-$COMMIT -q`; sudo docker tag $id coachingcloud/apc:dev-apc-$BUILD_NUMBER-$COMMIT; sudo docker push coachingcloud/apc'
                        // Clean up the build to release space disk
                        sh 'COMMIT=`git rev-parse --short HEAD`;id=`sudo docker images cc/apc:dev-$BUILD_NUMBER-$COMMIT -q`; sudo docker rmi -f $id'
                    } catch (all) {
                        slackSend (color: '#FF0000', message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
                        currentBuild.result = 'FAILURE'
                        error 'FAILURE'
                    }
                }
            }
        }
        stage('RunIMG') {
            agent {label 'slave-dev'}
            steps {
                script {
                    try {
                        sh 'sudo docker login -u ccjenkins -p 38YahXW4iRaHets6'
                        sh 'sleep 5'   
                        //pull the new image
                        sh 'COMMIT=`git rev-parse --short HEAD`;sudo docker pull coachingcloud/apc:dev-apc-$BUILD_NUMBER-$COMMIT'
                        //delete the old image
                        sh 'tid=`sudo docker ps | grep apc| awk \'{print $2}\' | awk -F: \'{print $2}\'`; if [ ! -z $tid ]; then sudo docker rm -f apc-development; sudo docker rmi -f `sudo docker images coachingcloud/apc:$tid -q`; fi'
                        //run the new one
                        sh 'COMMIT=`git rev-parse --short HEAD`;sudo docker run --name apc-development -d -p 49173:3000 coachingcloud/apc:dev-apc-$BUILD_NUMBER-$COMMIT'
                        sh 'echo "Opening URL: http://dev01.cc.cloud:49173"'
                        // Test service is opening or not
		        sleep 10
		        sh 'nc -zv localhost 49173 2>&1 | grep -c succeeded > status'
		        def service_status = readFile 'status'
		        if ( service_status ) {
                            echo 'INFO: The service is opening'
			    slackSend (color: '#00FF00', message: "SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL}) \n Service URL: http://dev01.cc.cloud:49173") 
			    currentBuild.result = 'SUCCESS'
                        } else {
                            echo 'ERR: The service is not opening'
			    slackSend (color: '#FF0000', message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
			    currentBuild.result = 'FAILURE'
                        }
                    } catch (all) {
                        slackSend (color: '#FF0000', message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
                        currentBuild.result = 'FAILURE'
                        error 'FAILURE'
                    }
                }
            }
        }
    }
}
