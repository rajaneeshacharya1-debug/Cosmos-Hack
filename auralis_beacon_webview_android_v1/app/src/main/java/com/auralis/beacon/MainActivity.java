package com.auralis.beacon;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

public class MainActivity extends Activity {

    private static final int REQ_LOCATION = 4729;
    private WebView webView;
    private FrameLayout root;
    private LinearLayout splash;
    private LinearLayout errorPanel;
    private ProgressBar progressBar;
    private TextView splashStatus;
    private String pendingGeoOrigin;
    private GeolocationPermissions.Callback pendingGeoCallback;

    private final String startUrl = "https://barbecue-fog-boots.ngrok-free.dev";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.setStatusBarColor(Color.parseColor("#03070B"));
        window.setNavigationBarColor(Color.parseColor("#03070B"));

        buildUi();
        configureWebView();
        requestLocationIfNeeded();
        webView.loadUrl(startUrl);
    }

    private void buildUi() {
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#03070B"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#03070B"));
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        splash = new LinearLayout(this);
        splash.setOrientation(LinearLayout.VERTICAL);
        splash.setGravity(Gravity.CENTER);
        splash.setPadding(dp(28), dp(28), dp(28), dp(28));
        splash.setBackgroundColor(Color.parseColor("#03070B"));

        TextView logo = new TextView(this);
        logo.setText("◎");
        logo.setTextColor(Color.parseColor("#65D9EA"));
        logo.setTextSize(58);
        logo.setGravity(Gravity.CENTER);
        splash.addView(logo);

        TextView title = new TextView(this);
        title.setText("AURALIS");
        title.setTextColor(Color.parseColor("#FFF7E8"));
        title.setTextSize(26);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setLetterSpacing(0.28f);
        title.setGravity(Gravity.CENTER);
        splash.addView(title);

        TextView subtitle = new TextView(this);
        subtitle.setText("Beacon recovery bridge");
        subtitle.setTextColor(Color.parseColor("#9FDDE8"));
        subtitle.setTextSize(14);
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, dp(8), 0, dp(18));
        splash.addView(subtitle);

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        LinearLayout.LayoutParams barParams = new LinearLayout.LayoutParams(dp(230), dp(8));
        splash.addView(progressBar, barParams);

        splashStatus = new TextView(this);
        splashStatus.setText("Loading secure dashboard...");
        splashStatus.setTextColor(Color.parseColor("#AFC5D1"));
        splashStatus.setTextSize(12);
        splashStatus.setGravity(Gravity.CENTER);
        splashStatus.setPadding(0, dp(14), 0, 0);
        splash.addView(splashStatus);

        root.addView(splash, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        errorPanel = new LinearLayout(this);
        errorPanel.setOrientation(LinearLayout.VERTICAL);
        errorPanel.setGravity(Gravity.CENTER);
        errorPanel.setPadding(dp(26), dp(26), dp(26), dp(26));
        errorPanel.setBackgroundColor(Color.parseColor("#03070B"));
        errorPanel.setVisibility(View.GONE);

        TextView errorTitle = new TextView(this);
        errorTitle.setText("Auralis server not reachable");
        errorTitle.setTextColor(Color.parseColor("#FFF7E8"));
        errorTitle.setTextSize(22);
        errorTitle.setTypeface(Typeface.DEFAULT_BOLD);
        errorTitle.setGravity(Gravity.CENTER);
        errorPanel.addView(errorTitle);

        TextView errorBody = new TextView(this);
        errorBody.setText("Start Node server and ngrok, then retry.\nExpected URL:\n" + startUrl);
        errorBody.setTextColor(Color.parseColor("#AFC5D1"));
        errorBody.setTextSize(13);
        errorBody.setGravity(Gravity.CENTER);
        errorBody.setPadding(0, dp(12), 0, dp(18));
        errorPanel.addView(errorBody);

        Button retry = new Button(this);
        retry.setText("Retry");
        retry.setTextColor(Color.parseColor("#03070B"));
        retry.setBackgroundColor(Color.parseColor("#65D9EA"));
        retry.setOnClickListener(v -> {
            errorPanel.setVisibility(View.GONE);
            splash.setVisibility(View.VISIBLE);
            webView.loadUrl(startUrl);
        });
        errorPanel.addView(retry, new LinearLayout.LayoutParams(dp(160), dp(48)));

        root.addView(errorPanel, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        setContentView(root);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUserAgentString(settings.getUserAgentString() + " AuralisBeaconWebView/0.1");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }

        WebView.setWebContentsDebuggingEnabled(true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                splashStatus.setText(newProgress < 90 ? "Syncing dashboard... " + newProgress + "%" : "Auralis ready");
                if (newProgress >= 95) {
                    splash.postDelayed(() -> splash.setVisibility(View.GONE), 450);
                }
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                } else {
                    pendingGeoOrigin = origin;
                    pendingGeoCallback = callback;
                    requestLocationIfNeeded();
                }
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                splashStatus.setText("Auralis ready");
                splash.postDelayed(() -> splash.setVisibility(View.GONE), 500);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && request.isForMainFrame()) {
                    showError();
                }
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                showError();
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                // Keep secure behavior. Do not bypass SSL errors in demo.
                handler.cancel();
                showError();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }
        });
    }

    private void showError() {
        splash.setVisibility(View.GONE);
        errorPanel.setVisibility(View.VISIBLE);
    }

    private boolean hasLocationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestLocationIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !hasLocationPermission()) {
            requestPermissions(new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
            }, REQ_LOCATION);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_LOCATION && pendingGeoCallback != null) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            pendingGeoCallback.invoke(pendingGeoOrigin, granted, false);
            pendingGeoCallback = null;
            pendingGeoOrigin = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            moveTaskToBack(true);
        }
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }
}
