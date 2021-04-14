#include <Arduino.h>
#include <MQTT.h>
#include <WiFiNINA.h>
#include "Arduino_LSM6DS3.h"


 char ssid[] = "T-2_4295d1";
 char pass[] = "INNBOX2729000677";

WiFiClient net;
MQTTClient client;

unsigned long lastMillis = 0;
void connect();
void messageReceived(String &topic, String &payload);

void connect() {
  Serial.print("checking wifi...");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    Serial.print(WiFi.status());
    delay(1000);
  }

  Serial.print("\nconnecting...");
  while (!client.connect("arduino", "public", "public")) {
    Serial.print("/");
    delay(1000);
  }

  Serial.println("\nconnected!");

  client.subscribe("hello");
}
//Declaring some global variables
float gyro_x, gyro_y, gyro_z;
long gyro_x_cal, gyro_y_cal, gyro_z_cal;
boolean set_gyro_angles;

float acc_x, acc_y, acc_z, acc_total_vector;
float angle_roll_acc, angle_pitch_acc;

float angle_pitch, angle_roll;
int angle_pitch_buffer, angle_roll_buffer;
float angle_pitch_output, angle_roll_output;

long loop_timer;
int temp;
void messageReceived(String &topic, String &payload) {
  Serial.println(topic + ": " + payload);
}
void setup() {

     // start the IMU:
  if (!IMU.begin()) {
    Serial.println("Failed to initialize IMU");
    // stop here if you can't access the IMU:
    while (true);
  }
  
  for (int cal_int = 0; cal_int < 1000 ; cal_int ++){                  //Read the raw acc and gyro data from the MPU-6050 for 1000 times
      // if both accelerometer and gyrometer are ready to be read:
    // read accelerometer and gyrometer:
    IMU.readGyroscope(gyro_x, gyro_y, gyro_z);                                           
    gyro_x_cal += gyro_x;                                              //Add the gyro x offset to the gyro_x_cal variable
    gyro_y_cal += gyro_y;                                              //Add the gyro y offset to the gyro_y_cal variable
    gyro_z_cal += gyro_z;                                              //Add the gyro z offset to the gyro_z_cal variable
    delay(3);                                                          //Delay 3us to have 250Hz for-loop
  }

  // divide by 1000 to get avarage offset
  gyro_x_cal /= 1000;                                                 
  gyro_y_cal /= 1000;                                                 
  gyro_z_cal /= 1000;                                                 
  Serial.begin(115200);
    // start wifi and mqtt
  WiFi.begin(ssid, pass);
  client.begin("192.168.64.101", net);
  client.onMessage(messageReceived);

  connect();
  loop_timer = micros();                                               //Reset the loop timer
}

void loop(){

  // read accelerometer and gyrometer:
  IMU.readGyroscope(gyro_x, gyro_y, gyro_z);
  IMU.readAcceleration(acc_x, acc_y, acc_z);
 //Subtract the offset values from the raw gyro values
  gyro_x -= gyro_x_cal;                                                
  gyro_y -= gyro_y_cal;                                                
  gyro_z -= gyro_z_cal;    

                                              
  // 15/78 https://www.st.com/resource/en/datasheet/lsm6ds33.pdf
  // https://invensense.tdk.com/products/motion-tracking/6-axis/mpu-6050/
  // LSM6ds33 sensitivity = 70 mdps/LSB   -->  0.000004=  (1 * 10**-3 )dps * 1 / 250Hz https://stackoverflow.com/questions/19161872/meaning-of-lsb-unit-and-unit-lsb
  //Gyro angle calculations . Note 0.0000611 = 1 / (250Hz x 65.5) 
  angle_pitch += gyro_x * 0.004;                                   //Calculate the traveled pitch angle and add this to the angle_pitch variable
  angle_roll += gyro_y * 0.004;                                    //Calculate the traveled roll angle and add this to the angle_roll variable
  //0.000001066 = 0.0000611 * (3.142(PI) / 180degr) The Arduino sin function is in radians
  // 0.00000488755 = 0.004 * (3.142 / 180)
  angle_pitch += angle_roll * sin(gyro_z * 0.00006982222);               //If the IMU has yawed transfer the roll angle to the pitch angel
  angle_roll -= angle_pitch * sin(gyro_z * 0.00006982222);               //If the IMU has yawed transfer the pitch angle to the roll angel
  
  //Accelerometer angle calculations
  acc_total_vector = sqrt((acc_x*acc_x)+(acc_y*acc_y)+(acc_z*acc_z));  //Calculate the total accelerometer vector
  //57.296 = 1 / (3.142 / 180) The Arduino asin function is in radians
  angle_pitch_acc = asin((float)acc_y/acc_total_vector)* 57.296;       //Calculate the pitch angle
  angle_roll_acc = asin((float)acc_x/acc_total_vector)* -57.296;       //Calculate the roll angle
  
  angle_pitch_acc -= 0.0;                                              //Accelerometer calibration value for pitch
  angle_roll_acc -= 0.0;                                               //Accelerometer calibration value for roll

  if(set_gyro_angles){                                                 //If the IMU is already started
    angle_pitch = angle_pitch * 0.9996 + angle_pitch_acc * 0.0004;     //Correct the drift of the gyro pitch angle with the accelerometer pitch angle
    angle_roll = angle_roll * 0.9996 + angle_roll_acc * 0.0004;        //Correct the drift of the gyro roll angle with the accelerometer roll angle
  }
  else{                                                                //At first start
    angle_pitch = angle_pitch_acc;                                     //Set the gyro pitch angle equal to the accelerometer pitch angle 
    angle_roll = angle_roll_acc;                                       //Set the gyro roll angle equal to the accelerometer roll angle 
    set_gyro_angles = true;                                            //Set the IMU started flag
  }
  
  //To dampen the pitch and roll angles a complementary filter is used
  angle_pitch_output = angle_pitch_output * 0.9 + angle_pitch * 0.1;   //Take 90% of the output pitch value and add 10% of the raw pitch value
  angle_roll_output = angle_roll_output * 0.9 + angle_roll * 0.1;      //Take 90% of the output roll value and add 10% of the raw roll value
    client.loop();
  // check if connected
  if (!client.connected()) {
    connect();
  }
  String message = String (abs(angle_roll_output)); //Serial.print(" | Angle  = "); 
  
  Serial.print("roll: ");
  Serial.print((angle_roll_output));
  Serial.print("pitch: ");
  Serial.println((angle_pitch_output));
  client.publish("/zGyro", message);

 while(micros() - loop_timer < 4000);                                 //Wait until the loop_timer reaches 4000us (250Hz) before starting the next loop
 loop_timer = micros();//Reset the loop timer
  
}
