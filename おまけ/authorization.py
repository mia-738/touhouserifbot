import tweepy

consumer_key = "xxxx"
consumer_secret = "xxxx"
auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
print(auth.get_authorization_url())



auth.get_access_token('xxxx')