plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

// The site the app reads from. For a local site: ./gradlew installDebug -PsiteUrl=http://10.0.2.2:3000
val siteUrl = (findProperty("siteUrl") as String?) ?: "https://bulbula-directory.vercel.app"

android {
    namespace = "et.bulbula.directory"
    compileSdk = 36

    defaultConfig {
        applicationId = "et.bulbula.directory"
        minSdk = 26
        targetSdk = 36
        versionCode = 2
        versionName = "1.1"
        buildConfigField("String", "SITE_URL", "\"$siteUrl\"")
        // Google sign-in for the progress backup: the Web client ID of Firebase project
        // bulbula-89af3 (not a secret). The release and debug keys' SHA-1s are registered there.
        buildConfigField("String", "GOOGLE_CLIENT_ID", "\"1078066225776-o3tlngthodb34h2uhis4r4ep6j5qf33k.apps.googleusercontent.com\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    androidResources {
        localeFilters += listOf("en", "am")
    }
    // Settings can switch language in the app, so Play must ship both languages to every phone.
    bundle {
        language {
            enableSplit = false
        }
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.material3)
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)
    implementation(libs.activity.compose)
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(libs.serialization.json)
    // The only HTTP client: Android's HttpURLConnection can't send PATCH, which admin edits need.
    implementation(libs.okhttp)
    implementation(libs.credentials)
    implementation(libs.credentials.play.services)
    implementation(libs.googleid)
    testImplementation(libs.junit)
    testImplementation(libs.okhttp.mockwebserver)
    testImplementation(libs.org.json)
}
