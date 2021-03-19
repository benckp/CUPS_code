package com.example.cups_android;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;

public class DisplayForum extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_display_forum);

        // Get Intent that start the activity and string extraction
        Intent intent = getIntent();
        String msg = intent.getStringExtra(MainActivity.EXTRA_MESSAGE);

        // Capture layout's TextView and set string as value
        TextView textView = findViewById(R.id.textView);
        textView.setText("You have searched \"" + msg + "\"");
    }
}