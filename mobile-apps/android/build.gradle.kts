// Top-level build file for Fleet Mobile Android
buildscript {
    extra.apply {
        set("kotlin_version", "1.9.20")
        set("compose_version", "1.5.4")
        set("compose_bom_version", "2023.10.01")
    }

    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath("com.android.tools.build:gradle:8.1.4")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.20")
        classpath("com.google.dagger:hilt-android-gradle-plugin:2.48.1")
        classpath("com.google.gms:google-services:4.4.0")
        classpath("com.google.firebase:firebase-crashlytics-gradle:2.9.9")
    }
}

plugins {
    id("com.android.application") version "8.1.4" apply false
    id("org.jetbrains.kotlin.android") version "1.9.20" apply false
    id("com.google.dagger.hilt.android") version "2.48.1" apply false
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
