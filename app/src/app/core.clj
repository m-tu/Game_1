(ns app.core
  (:use org.httpkit.server
        [clojure.tools.logging :only [info]]
        overtone.at-at
        org.nfrac.cljbox2d.core)
  (:require [ring.middleware.reload :as reload]
            [clojure.data.json :as json]
            [compojure.handler :refer [site]]
            [compojure.route :as route]
            [compojure.core :refer [defroutes GET]]))

(defonce server (atom nil))

(defn stop-server []
  (when-not (nil? @server)
    (@server :timeout 100)
    (reset! server nil)))

(def pool (mk-pool))

(defn ws-handler [request]
  (with-channel request channel
    (info channel "connected")
    (def world (new-world))
    (def ball (body! world { :position [300 500] } { :shape (circle 1) :restitution 0.1 }))
    (def ground (body! world {:type :static} {:shape (edge [-1000 0] [1000 0])}))
    (every 20 #(step! world (/ 1 100)) pool)
    (every 100 #(send! channel (json/write-str (position ball))) pool)
    (on-close channel (fn [status] (info "channel closed: " status)))
    (on-receive channel (fn [data]
                          (info data)
                          (send! channel data)))))

(defroutes all-routes
  (GET "/" [] "gtfo")
  (GET "/feed" [] ws-handler)
  (route/not-found "not found"))

(defn in-dev? [args] true)

(defn start-server [& args]
  (let [handler (if (in-dev? args)
                 (reload/wrap-reload (site #'all-routes))
                 (site all-routes))]
    (reset! server (run-server handler { :port 9001 }))))
