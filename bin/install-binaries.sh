cd /home/hosting-user

if [ -f youtube-dl ]; then
  ./youtube-dl -U
else
  wget https://yt-dl.org/downloads/latest/youtube-dl
  chmod a+rx /home/hosting-user/youtube-dl
fi

wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar xf ffmpeg-release-amd64-static.tar.xz
rm ffmpeg-release-amd64-static.tar.xz
mv ffmpeg-*-amd64-static/ffmpeg ffmpeg
rm -rf ffmpeg-*-amd64-static/
