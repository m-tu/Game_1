(ns app.core
  (:use org.httpkit.server
        [clojure.tools.logging :only [info]]
        overtone.at-at)
  (:require [ring.middleware.reload :as reload]
            [compojure.handler :refer [site]]
            [compojure.route :as route]
            [compojure.core :refer [defroutes GET]]))

(def pool (mk-pool))

(defn ws-handler [request]
  (with-channel request channel
    (info channel "connected")
    (every 500 #(send! channel "tits") pool)
    (on-close channel (fn [status] (info "channel closed: " status)))
    (on-receive channel (fn [data]
                          (info data)
                          (send! channel data)))))

(defroutes all-routes
  (GET "/" [] "gtfo")
  (GET "/feed" [] ws-handler)
  (route/not-found "not found"))

(defn in-dev? [args] true)

(defn -main [& args]
  (let [handler (if (in-dev? args)
                 (reload/wrap-reload (site #'all-routes))
                 (site all-routes))]
    (run-server handler { :port 9001 })))
