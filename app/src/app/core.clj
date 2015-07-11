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
(defonce world (atom nil))
(defonce clients (atom {}))

(def pool (mk-pool))

(defn ws-handler [request]
  (with-channel request channel
    (info channel "connected")
    (swap! clients assoc channel true)
    (def ball (body! @world { :position [(+ 50 (rand-int 400)) 500] } { :shape (circle 1) :restitution 0.1 }))
    (def do-send (every 100 #(send! channel (json/write-str (position ball))) pool))
    (on-close channel (fn [status]
                        (stop do-send)
                        (destroy! ball)
                        (swap! clients dissoc channel)
                        (info "channel closed: " status)))
    (on-receive channel (fn [data]
                          (send! channel data)))))

(defroutes all-routes
  (GET "/" [] "gtfo")
  (GET "/feed" [] ws-handler)
  (route/not-found "not found"))

(defn in-dev? [args] true)

(defn stop-server []
  (when-not (nil? @server)
    (doseq [conn (keys @clients)]
      (close conn))
    (reset! clients {})
    (@server :timeout 250)
    (stop-and-reset-pool! pool)
    (reset! server nil)))

(defn state-broadcast [channels]
  (doseq [channel channels]
    ;(send! channel "broadcast")
    ()))

(defn start-server [& args]
  (let [handler (if (in-dev? args)
                 (reload/wrap-reload (site #'all-routes))
                 (site all-routes))]
    (stop-server)
    (reset! world (new-world))
    (body! @world {:type :static} {:shape (edge [-1000 0] [1000 0])})
    (every 20 #(step! @world (/ 1 100)) pool)
    (every 500 #(state-broadcast (keys @clients)) pool)
    (reset! server (run-server handler { :port 9001 }))))
