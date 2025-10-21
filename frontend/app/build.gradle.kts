plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.cpen321.roomsync"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.cpen321.roomsync"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
    buildFeatures {
        compose = true
    }
    
    lint {
        disable += "NullSafeMutableLiveData"
        abortOnError = false
        checkReleaseBuilds = false
        checkDependencies = false
    }
}

dependencies {

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.9.5")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.0")
    
    // Image loading and picking
    implementation("io.coil-kt:coil-compose:2.6.0")
    implementation("androidx.activity:activity-compose:1.9.3")

//    //THIS IS FROM M1
//    // Navigation
//    implementation(libs.androidx.navigation.compose)
//
//    // ViewModel
//    implementation(libs.androidx.lifecycle.viewmodel.compose)
//
//    // Hilt Dependency Injection
//    implementation(libs.hilt.android)
//    ksp(libs.hilt.android.compiler)
//    implementation(libs.hilt.navigation.compose)
//
//    // Google Sign-In
//    implementation(libs.play.services.auth)
//
//    // HTTP client
//    implementation(libs.retrofit)
//    implementation(libs.converter.gson)
//    implementation(libs.logging.interceptor)
//
//    // Image loading
//    implementation(libs.coil.compose)
//
//    // Camera and Image handling
//    implementation(libs.androidx.activity.ktx)
//    implementation(libs.androidx.activity.compose)
//
//    // Coroutines
//    implementation(libs.kotlinx.coroutines.android)
//
//    // Shared Preferences
//    implementation(libs.androidx.datastore.preferences)
//
//    // Material Design Components
//    implementation(libs.material)
//
//    implementation(libs.kotlinx.coroutines.play.services)
//
//    implementation(libs.androidx.credentials)
//    implementation(libs.androidx.credentials.play.services.auth)
//    implementation(libs.googleid)
//
//
//    //THIS IS WHAT SUGGESTED AI
//    implementation("androidx.core:core-ktx:1.13.1")
//    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.5")
//    implementation("androidx.activity:activity-compose:1.9.3")
//    implementation("androidx.compose.ui:ui:1.7.4")
//    implementation("androidx.compose.material3:material3:1.3.0")
//    implementation("androidx.navigation:navigation-compose:2.8.3")
//
//    // Networking
//    implementation("com.squareup.retrofit2:retrofit:2.11.0")
//    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
//    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
//
//    // Coroutines
//    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
//
//    // Google Auth (for sign-in)
//    implementation("com.google.android.gms:play-services-auth:21.2.0")
//
//    // Coil (for profile pictures)
//    implementation("io.coil-kt:coil-compose:2.6.0")

}
