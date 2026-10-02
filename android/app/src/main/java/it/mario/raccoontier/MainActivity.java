package it.mario.raccoontier;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends Activity {
    static final String HOST = "kur0chanx.github.io";
    static final String HOME = "https://" + HOST + "/TierListGame/";
    static final Set<String> ORIGINS = Collections.singleton("https://" + HOST);
    static final int PICK = 7;
    static final int BG = 0xff0a0620;

    FrameLayout root;
    WebView web;
    View customView;
    ValueCallback<Uri[]> fileCb;
    Uri cameraUri;
    TextToSpeech tts;
    JavaScriptReplyProxy reply;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setDecorFitsSystemWindows(false);
        root = new FrameLayout(this);
        root.setBackgroundColor(BG);
        root.setOnApplyWindowInsetsListener((v, ins) -> {
            v.setPadding(0, 0, 0, ins.getInsets(WindowInsets.Type.ime()).bottom);
            return ins;
        });
        web = new WebView(this);
        web.setBackgroundColor(BG);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        hideBars();
        setupWeb();
        if (b != null) web.restoreState(b);
        if (b == null || web.getUrl() == null) web.loadUrl(HOME);
    }

    void hideBars() {
        WindowInsetsController c = getWindow().getInsetsController();
        if (c == null) return;
        c.hide(WindowInsets.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    void setupWeb() {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setAllowFileAccess(false);
        s.setSupportMultipleWindows(false);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setUserAgentString(s.getUserAgentString() + " RaccoonTierApk/1");

        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "RTApk", ORIGINS, (view, msg, origin, main, proxy) -> {
                reply = proxy;
                onPageMessage(msg.getData());
            });
        }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(web, asset("rt-apk.js"), ORIGINS);
        }

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                if (!r.isForMainFrame()) return false;
                Uri u = r.getUrl();
                String sc = u.getScheme();
                if (("https".equals(sc) || "http".equals(sc)) && HOST.equals(u.getHost())) return false;
                openOutside(u);
                return true;
            }

            @Override
            public boolean onRenderProcessGone(WebView v, android.webkit.RenderProcessGoneDetail d) {
                recreate();
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                return pickFiles(p);
            }

            @Override
            public void onShowCustomView(View view, CustomViewCallback cb) {
                customView = view;
                root.addView(view, new FrameLayout.LayoutParams(-1, -1));
            }

            @Override
            public void onHideCustomView() {
                if (customView != null) root.removeView(customView);
                customView = null;
            }
        });
    }

    String asset(String name) {
        try (InputStream in = getAssets().open(name)) {
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
            return o.toString(StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            return "";
        }
    }

    void openOutside(Uri u) {
        try {
            Intent i = "intent".equals(u.getScheme()) ? Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME) : new Intent(Intent.ACTION_VIEW, u);
            i.addCategory(Intent.CATEGORY_BROWSABLE);
            i.setComponent(null);
            i.setSelector(null);
            startActivity(i);
        } catch (Exception e) {
            toast("Non riesco ad aprire il link");
        }
    }

    boolean pickFiles(WebChromeClient.FileChooserParams p) {
        Intent pick = p.createIntent();
        if (p.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE) pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        Intent chooser = Intent.createChooser(pick, "Scegli");
        cameraUri = null;
        String acc = String.join(",", p.getAcceptTypes());
        if (acc.isEmpty() || acc.contains("image")) {
            try {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Images.Media.DISPLAY_NAME, "raccoon-" + System.currentTimeMillis() + ".jpg");
                cv.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                cv.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Raccoon Tier");
                cameraUri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                Intent cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                cam.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
                cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cam});
            } catch (Exception e) {
                cameraUri = null;
            }
        }
        try {
            startActivityForResult(chooser, PICK);
            return true;
        } catch (ActivityNotFoundException e) {
            fileCb = null;
            return false;
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req != PICK) {
            super.onActivityResult(req, res, data);
            return;
        }
        Uri[] out = null;
        if (res == RESULT_OK) {
            if (data != null && data.getClipData() != null) {
                int n = data.getClipData().getItemCount();
                out = new Uri[n];
                for (int i = 0; i < n; i++) out[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data != null && data.getData() != null) {
                out = new Uri[]{data.getData()};
            } else if (cameraUri != null) {
                out = new Uri[]{cameraUri};
            }
        }
        boolean usedCamera = out != null && out.length == 1 && out[0].equals(cameraUri);
        if (cameraUri != null && !usedCamera) {
            try { getContentResolver().delete(cameraUri, null, null); } catch (Exception ignored) {}
        }
        cameraUri = null;
        if (fileCb != null) fileCb.onReceiveValue(out);
        fileCb = null;
    }

    void onPageMessage(String data) {
        try {
            JSONObject m = new JSONObject(data);
            switch (m.optString("t")) {
                case "save": saveFile(m.optString("name"), m.optString("mime"), m.optString("data")); break;
                case "speak": speak(m.optInt("id"), m.optString("text"), m.optDouble("rate", 1), m.optDouble("pitch", 1), m.optString("lang", "it-IT")); break;
                case "stop": if (tts != null) tts.stop(); break;
            }
        } catch (Exception ignored) {}
    }

    void saveFile(String name, String mime, String b64) {
        String safe = name.replaceAll("[\\\\/:*?\"<>|]", "_");
        new Thread(() -> {
            try {
                byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                cv.put(MediaStore.Downloads.MIME_TYPE, mime);
                cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Raccoon Tier");
                Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                try (OutputStream o = getContentResolver().openOutputStream(u)) { o.write(bytes); }
                runOnUiThread(() -> toast("Salvato in Download/Raccoon Tier: " + safe));
            } catch (Exception e) {
                runOnUiThread(() -> toast("Salvataggio non riuscito"));
            }
        }).start();
    }

    void speak(int id, String text, double rate, double pitch, String lang) {
        if (tts == null) {
            tts = new TextToSpeech(this, st -> {
                if (st == TextToSpeech.SUCCESS) speak(id, text, rate, pitch, lang);
                else ttsEvent(id, "error");
            });
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String u) { ttsEvent(Integer.parseInt(u), "start"); }
                @Override public void onDone(String u) { ttsEvent(Integer.parseInt(u), "end"); }
                @Override public void onError(String u) { ttsEvent(Integer.parseInt(u), "error"); }
            });
            return;
        }
        tts.setLanguage(Locale.forLanguageTag(lang));
        tts.setSpeechRate((float) rate);
        tts.setPitch((float) pitch);
        if (tts.speak(text, TextToSpeech.QUEUE_ADD, null, String.valueOf(id)) != TextToSpeech.SUCCESS) ttsEvent(id, "error");
    }

    void ttsEvent(int id, String ev) {
        runOnUiThread(() -> {
            if (reply == null) return;
            try { reply.postMessage(new JSONObject().put("t", "tts").put("id", id).put("ev", ev).toString()); } catch (Exception ignored) {}
        });
    }

    void toast(String s) { Toast.makeText(this, s, Toast.LENGTH_LONG).show(); }

    @Override
    public void onBackPressed() {
        if (customView != null) { web.getWebChromeClient().onHideCustomView(); return; }
        if (web.canGoBack()) web.goBack();
        else moveTaskToBack(true);
    }

    @Override
    public void onWindowFocusChanged(boolean f) {
        super.onWindowFocusChanged(f);
        if (f) hideBars();
    }

    @Override protected void onResume() { super.onResume(); web.onResume(); hideBars(); }
    @Override protected void onPause() { web.onPause(); super.onPause(); }
    @Override protected void onSaveInstanceState(Bundle o) { super.onSaveInstanceState(o); web.saveState(o); }

    @Override
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        ((ViewGroup) web.getParent()).removeView(web);
        web.destroy();
        super.onDestroy();
    }
}
